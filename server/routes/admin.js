// server/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { adminRequired } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const storageService = require('../services/storageService');

// Multer in-memory storage configuration for admin asset uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed.'), false);
    }
  }
});

// All admin routes require admin role
router.use(adminRequired);

// GET /api/admin/stats - Complete, 100% Real SQL Database Aggregated Analytics
router.get('/stats', (req, res) => {
  try {
    const lowStockThreshold = parseInt(db.getSetting('low_stock_threshold', '20'), 10) || 20;

    // 1. Core metric cards (All directly from database)
    const totalOrdersRow = db.prepare('SELECT COUNT(*) as count FROM orders').get();
    const pendingOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('pending_payment', 'payment_verification')").get();
    const confirmedOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'").get();
    const processingOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status IN ('processing', 'packed', 'dispatched', 'shipped', 'out_for_delivery')").get();
    const deliveredOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'delivered'").get();
    const cancelledOrdersRow = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'cancelled'").get();
    
    const pendingPaymentsRow = db.prepare("SELECT COUNT(*) as count FROM payments WHERE payment_status IN ('submitted', 'under_verification')").get();
    const totalSalesRow = db.prepare("SELECT COALESCE(SUM(grand_total), 0) as total FROM orders WHERE status != 'cancelled'").get();

    // 2. Low stock and inventory overview
    const totalProductsRow = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get();
    const lowStockCountRow = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock <= ? AND is_active = 1').get(lowStockThreshold);

    // 3. Status breakdown
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `).all();

    // 4. Daily Sales Trend (Real past 14 days aggregation from SQLite)
    const salesOverTime = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        COALESCE(SUM(grand_total), 0) as revenue
      FROM orders
      WHERE status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 30
    `).all();

    // 5. Top selling products
    const topProducts = db.prepare(`
      SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_sales
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_id, oi.product_name
      ORDER BY total_sold DESC
      LIMIT 5
    `).all();

    // 6. Category sales breakdown
    const categorySales = db.prepare(`
      SELECT 
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.total_price), 0) as total_sales
      FROM categories c
      JOIN products p ON p.category_id = c.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY c.id, c.name
      ORDER BY total_sales DESC
      LIMIT 6
    `).all();

    // 7. Low stock items list
    const lowStockItems = db.prepare(`
      SELECT id, name, sku, stock, price, unit
      FROM products
      WHERE stock <= ? AND is_active = 1
      ORDER BY stock ASC
      LIMIT 10
    `).all(lowStockThreshold);

    res.json({
      success: true,
      stats: {
        total_orders: totalOrdersRow.count,
        pending_orders: pendingOrdersRow.count,
        confirmed_orders: confirmedOrdersRow.count,
        processing_orders: processingOrdersRow.count,
        delivered_orders: deliveredOrdersRow.count,
        cancelled_orders: cancelledOrdersRow.count,
        pending_payments: pendingPaymentsRow.count,
        total_sales: totalSalesRow.total,
        total_revenue: totalSalesRow.total,
        total_products: totalProductsRow.count,
        low_stock_count: lowStockCountRow.count,
        low_stock_threshold: lowStockThreshold,
        status_counts: statusCounts,
        sales_over_time: salesOverTime,
        top_products: topProducts,
        category_sales: categorySales,
        low_stock_items: lowStockItems
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/orders - Multi-filter order list
router.get('/orders', (req, res) => {
  try {
    const { status, payment_status, search, date_from, date_to } = req.query;

    let sql = `
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    if (payment_status && payment_status !== 'all') {
      sql += ` AND p.payment_status = ?`;
      params.push(payment_status);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ` AND (o.order_number LIKE ? OR o.tracking_number LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR p.transaction_reference LIKE ?)`;
      params.push(q, q, q, q, q, q);
    }

    if (date_from) {
      sql += ` AND DATE(o.created_at) >= DATE(?)`;
      params.push(date_from);
    }

    if (date_to) {
      sql += ` AND DATE(o.created_at) <= DATE(?)`;
      params.push(date_to);
    }

    sql += ` ORDER BY o.created_at DESC`;

    const orders = db.prepare(sql).all(...params);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.id),
      parsed_address: JSON.parse(ord.address_snapshot || '{}')
    }));

    res.json({
      success: true,
      orders: enriched
    });
  } catch (err) {
    console.error('Admin orders fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
});

// GET /api/admin/orders/:id - Single order details with timeline
router.get('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare(`
      SELECT 
        o.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        p.id as payment_id,
        p.payment_method,
        p.payment_status,
        p.amount as payment_amount,
        p.upi_id,
        p.transaction_reference,
        p.customer_submitted_at,
        p.verified_at,
        p.verified_by
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const timeline = db.getOrderTimeline(order.id);

    res.json({
      success: true,
      order: {
        ...order,
        items,
        parsed_address: JSON.parse(order.address_snapshot || '{}'),
        timeline
      }
    });
  } catch (err) {
    console.error('Admin single order fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
});

// PATCH /api/admin/orders/:id/status - Update status with timeline event and notifications
router.patch('/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number, notes } = req.body;
    const adminName = (req.user && req.user.name) ? req.user.name : 'Store Admin';

    const allowed = [
      'pending_payment',
      'payment_verification',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'dispatched',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status value.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const updatedTracking = tracking_number !== undefined ? tracking_number : order.tracking_number;

    // Descriptive titles and explanations for each transition
    const statusMeta = {
      pending_payment: { title: 'Pending Payment', desc: 'Awaiting customer payment' },
      payment_verification: { title: 'Payment Verification', desc: 'Customer submitted payment details' },
      confirmed: { title: 'Order Confirmed', desc: 'Verified and confirmed for fulfillment' },
      processing: { title: 'Order in Processing', desc: 'Factory picking and safety packaging at Sivakasi depot' },
      packed: { title: 'Order Packed & Sealed', desc: 'Packed in explosive-safe moisture-proof boxes' },
      shipped: { title: 'Order Shipped / Dispatched', desc: `Handed over to licensed hazardous logistics (Tracking: ${updatedTracking || 'N/A'})` },
      dispatched: { title: 'Order Dispatched', desc: `Dispatched from Sivakasi central hub (Tracking: ${updatedTracking || 'N/A'})` },
      out_for_delivery: { title: 'Out for Delivery', desc: 'Local delivery agent is en route with your package' },
      delivered: { title: 'Order Delivered', desc: 'Package successfully handed over to customer' },
      cancelled: { title: 'Order Cancelled', desc: notes || 'Order cancelled by store administrator' }
    };

    const currentMeta = statusMeta[status] || { title: `Status: ${status}`, desc: notes || '' };

    db.prepare(`
      UPDATE orders
      SET status = ?, tracking_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, updatedTracking, id);

    // Record permanent timeline event
    db.addOrderTimelineEvent(
      order.id,
      status,
      currentMeta.title,
      notes ? `${currentMeta.desc} - ${notes}` : currentMeta.desc,
      adminName
    );

    // Notify customer
    notificationService.notify(`order_${status}`, {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.grand_total,
      notes: notes || currentMeta.desc
    });

    res.json({
      success: true,
      message: `Order status updated to "${status}".`,
      order_id: id,
      status,
      tracking_number: updatedTracking
    });
  } catch (err) {
    console.error('Admin update order status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
});

// POST /api/admin/orders/:id/cancel - Admin cancels order with inventory restoration
router.post('/orders/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminName = (req.user && req.user.name) ? req.user.name : 'Store Admin';

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This order is already cancelled.' });
    }

    const cancelTx = db.transaction(() => {
      // 1. Restore product inventory
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
      const restoreStockStmt = db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

      for (const item of items) {
        restoreStockStmt.run(item.quantity, item.product_id);
      }

      // 2. Update order status and record reason
      db.prepare(`
        UPDATE orders
        SET status = 'cancelled',
            cancellation_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason || 'Cancelled by store administration', order.id);

      // 3. If payment was submitted or pending, update payment status
      db.prepare(`
        UPDATE payments
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ? AND payment_status IN ('pending', 'submitted', 'under_verification')
      `).run(order.id);

      // 4. Record in order timeline
      db.addOrderTimelineEvent(
        order.id,
        'cancelled',
        'Order Cancelled by Admin',
        `Cancellation reason: ${reason || 'Administrative cancellation'}. Inventory has been restored.`,
        adminName
      );
    });

    cancelTx();

    notificationService.notify('order_cancelled', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.grand_total,
      notes: reason || 'Cancelled by administrator'
    });

    res.json({
      success: true,
      message: `Order ${order.order_number} has been cancelled and stock restored to inventory.`
    });
  } catch (err) {
    console.error('Admin cancel order error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

// GET /api/admin/payments - List all payments with filter for verification queue
router.get('/payments', (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT 
        p.id as payment_id,
        p.order_id,
        p.customer_id,
        p.payment_method,
        p.payment_status,
        p.amount,
        p.currency,
        p.upi_id,
        p.transaction_id,
        p.transaction_reference,
        p.customer_submitted_at,
        p.verified_at,
        p.verified_by,
        p.paid_at,
        p.created_at,
        p.updated_at,
        o.order_number,
        o.status as order_status,
        o.grand_total,
        o.created_at as order_created_at,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      LEFT JOIN users u ON u.id = o.user_id
    `;

    const params = [];
    if (status && status !== 'all') {
      sql += ` WHERE p.payment_status = ?`;
      params.push(status);
    }

    sql += `
      ORDER BY 
        CASE 
          WHEN p.payment_status IN ('submitted', 'under_verification') THEN 0
          WHEN p.payment_status = 'pending' THEN 1
          ELSE 2 
        END,
        p.created_at DESC
    `;

    const payments = db.prepare(sql).all(...params);

    const pendingCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE payment_status IN ('submitted', 'under_verification')
    `).get();

    res.json({
      success: true,
      payments,
      pending_verifications_count: pendingCountRow ? pendingCountRow.count : 0
    });
  } catch (err) {
    console.error('Admin payments fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payments.' });
  }
});

// POST /api/admin/payments/:id/verify - Admin marks UPI payment as verified & paid
router.post('/payments/:id/verify', (req, res) => {
  try {
    const { id } = req.params;
    const adminName = (req.user && req.user.name) ? req.user.name : 'Store Admin';

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found.' });
    }

    const verifyTx = db.transaction(() => {
      // 1. Update Payment record to 'paid'
      db.prepare(`
        UPDATE payments
        SET payment_status = 'paid',
            verified_at = CURRENT_TIMESTAMP,
            verified_by = ?,
            paid_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(adminName, id);

      // 2. Transition Order to 'confirmed'
      db.prepare(`
        UPDATE orders
        SET status = 'confirmed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.id);

      // 3. Record in order timeline
      db.addOrderTimelineEvent(
        order.id,
        'confirmed',
        'Payment Verified & Order Confirmed',
        `UPI payment of ₹${payment.amount} (Ref: ${payment.transaction_reference || 'Confirmed'}) successfully verified by ${adminName}.`,
        adminName
      );
    });

    verifyTx();

    notificationService.notify('payment_verified', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: payment.amount,
      notes: `Verified by ${adminName}`
    });

    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

    res.json({
      success: true,
      message: `Payment for order ${order.order_number} has been verified and confirmed!`,
      payment: updatedPayment,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Admin verify payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
});

// POST /api/admin/payments/:id/reject - Admin rejects invalid payment
router.post('/payments/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminName = (req.user && req.user.name) ? req.user.name : 'Store Admin';

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Associated order not found.' });
    }

    const rejectTx = db.transaction(() => {
      // 1. Update Payment record to 'failed'
      db.prepare(`
        UPDATE payments
        SET payment_status = 'failed',
            verified_at = CURRENT_TIMESTAMP,
            verified_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(adminName, id);

      // 2. Order remains unpaid (set status back to pending_payment)
      db.prepare(`
        UPDATE orders
        SET status = 'pending_payment',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(order.id);

      // 3. Record in order timeline
      db.addOrderTimelineEvent(
        order.id,
        'pending_payment',
        'Payment Submission Rejected',
        `UPI payment verification rejected by ${adminName}. Reason: ${reason || 'Invalid or unreceived transaction reference'}. Please submit a valid UTR.`,
        adminName
      );
    });

    rejectTx();

    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

    res.json({
      success: true,
      message: `Payment for order ${order.order_number} marked as rejected. Order remains pending payment.`,
      reason: reason || 'Invalid or unreceived transaction reference',
      payment: updatedPayment,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Admin reject payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject payment.' });
  }
});

// GET /api/admin/inventory - Inventory overview with SKU, stock, and low stock threshold
router.get('/inventory', (req, res) => {
  try {
    const lowStockThreshold = parseInt(db.getSetting('low_stock_threshold', '20'), 10) || 20;

    const products = db.prepare(`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.price,
        p.mrp,
        p.stock,
        p.unit,
        p.is_active,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.stock ASC, p.name ASC
    `).all();

    const inventoryList = products.map(p => {
      let status = 'in_stock';
      if (p.stock <= 0) {
        status = 'out_of_stock';
      } else if (p.stock <= lowStockThreshold) {
        status = 'low_stock';
      }
      return {
        ...p,
        status,
        low_stock_threshold: lowStockThreshold
      };
    });

    res.json({
      success: true,
      low_stock_threshold: lowStockThreshold,
      total_products: inventoryList.length,
      inventory: inventoryList
    });
  } catch (err) {
    console.error('Admin inventory error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
  }
});

// PATCH /api/admin/inventory/:id/stock - Inline stock update
router.patch('/inventory/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock) || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative stock count is required.' });
    }

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(stock), id);
    res.json({ success: true, message: 'Stock updated successfully.', stock: Number(stock) });
  } catch (err) {
    console.error('Admin stock update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update stock.' });
  }
});

// GET /api/admin/customers - Real database customer directory with lifetime statistics
router.get('/customers', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.created_at as registered_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.grand_total ELSE 0 END), 0) as lifetime_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY lifetime_spent DESC, total_orders DESC
    `).all();

    res.json({
      success: true,
      total_customers: customers.length,
      customers
    });
  } catch (err) {
    console.error('Admin customers error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customer list.' });
  }
});

// GET /api/admin/addresses - Customer address book directory
router.get('/addresses', (req, res) => {
  try {
    const addresses = db.prepare(`
      SELECT 
        a.*,
        u.name as customer_name,
        u.email as customer_email,
        (SELECT COUNT(*) FROM orders WHERE address_id = a.id) as orders_delivered_here
      FROM addresses a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
    `).all();

    res.json({
      success: true,
      total_addresses: addresses.length,
      addresses
    });
  } catch (err) {
    console.error('Admin addresses error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch customer addresses.' });
  }
});

// GET /api/admin/coupons - List all discount coupons
router.get('/coupons', (req, res) => {
  try {
    const coupons = db.prepare(`
      SELECT * FROM coupons 
      ORDER BY created_at DESC
    `).all();

    res.json({
      success: true,
      coupons
    });
  } catch (err) {
    console.error('Admin fetch coupons error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
});

// POST /api/admin/coupons - Create discount coupon
router.post('/coupons', (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_amount,
      max_discount_amount,
      expires_at
    } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ success: false, message: 'Coupon code, discount type, and discount value are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon with code "${cleanCode}" already exists.` });
    }

    const stmt = db.prepare(`
      INSERT INTO coupons (
        code, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, is_active, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const result = stmt.run(
      cleanCode,
      description || '',
      discount_type === 'flat' ? 'flat' : 'percent',
      Number(discount_value),
      min_order_amount ? Number(min_order_amount) : 0,
      max_discount_amount ? Number(max_discount_amount) : null,
      expires_at || null
    );

    const created = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully.`,
      coupon: created
    });
  } catch (err) {
    console.error('Admin create coupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to create coupon.' });
  }
});

// PATCH /api/admin/coupons/:id/toggle - Toggle coupon active state
router.patch('/coupons/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const newActive = coupon.is_active ? 0 : 1;
    db.prepare('UPDATE coupons SET is_active = ? WHERE id = ?').run(newActive, id);

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${newActive ? 'active' : 'inactive'}.`,
      is_active: newActive
    });
  } catch (err) {
    console.error('Admin toggle coupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to update coupon status.' });
  }
});

// DELETE /api/admin/coupons/:id - Delete coupon
router.delete('/coupons/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM coupons WHERE id = ?').run(id);
    res.json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (err) {
    console.error('Admin delete coupon error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
});

// GET /api/admin/settings - Retrieve store and payment settings
router.get('/settings', (req, res) => {
  try {
    const settings = db.getAllSettings();
    res.json({
      success: true,
      settings
    });
  } catch (err) {
    console.error('Admin fetch settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

// POST /api/admin/settings - Update store and payment settings
router.post('/settings', (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings payload.' });
    }

    const allowedKeys = [
      'store_name',
      'store_phone',
      'store_email',
      'store_address',
      'shop_upi_id',
      'shop_name',
      'low_stock_threshold',
      'min_order_amount',
      'shipping_fee',
      'free_shipping_threshold',
      'payment_expiry_minutes',
      'require_utr'
    ];

    for (const [key, val] of Object.entries(updates)) {
      if (allowedKeys.includes(key)) {
        db.setSetting(key, String(val));
      }
    }

    const refreshed = db.getAllSettings();

    res.json({
      success: true,
      message: 'Store settings updated successfully.',
      settings: refreshed
    });
  } catch (err) {
    console.error('Admin update settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

// POST /api/admin/upload-image - Upload product or promotional banner image
router.post('/upload-image', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided in request.'
      });
    }

    try {
      const uploadResult = await storageService.uploadImage(req.file);
      res.json({
        success: true,
        message: 'Image uploaded successfully.',
        url: uploadResult.url,
        provider: uploadResult.provider
      });
    } catch (uploadErr) {
      console.error('Image processing error:', uploadErr);
      res.status(500).json({
        success: false,
        message: uploadErr.message || 'Failed to upload and store image.'
      });
    }
  });
});

module.exports = router;
