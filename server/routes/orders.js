const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authRequired, optionalAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

// In-flight locking mechanism to prevent duplicate submissions from rapid clicks
const orderSubmissionLocks = new Set();

// Helper to generate readable festive order number
function generateOrderNumber() {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `BLAST-${year}-${randomPart}`;
}

// Helper to generate dynamic UPI URI with proper URL parameter encoding
function buildUpiUri(upiId, shopName, amount, orderNumber) {
  const cleanAmount = Number(amount).toFixed(2);
  const params = new URLSearchParams({
    pa: upiId,
    pn: shopName,
    am: cleanAmount,
    cu: 'INR',
    tn: `Order ${orderNumber}`
  });
  return `upi://pay?${params.toString()}`;
}

// Helper to reliably parse SQLite UTC CURRENT_TIMESTAMP in Node.js
function parseSqliteDate(dateStr) {
  if (!dateStr) return Date.now();
  const s = String(dateStr).trim();
  if (s.includes('Z')) return new Date(s).getTime();
  return new Date(s.replace(' ', 'T') + 'Z').getTime();
}

// Order Status Enum:
// 'pending_payment', 'payment_verification', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'

// Payment Status Enum:
// 'pending', 'submitted', 'under_verification', 'paid', 'failed', 'refunded'

// POST /api/orders/create - Complete, Secure Order Placement
router.post('/create', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const sessionId = req.headers['x-session-id'] || req.body.session_id;
  const lockKey = userId ? `user_${userId}` : `session_${sessionId}`;

  // 1. Double-submission prevention check
  if (orderSubmissionLocks.has(lockKey)) {
    return res.status(429).json({
      success: false,
      message: 'Your order is currently being processed. Please do not submit multiple times.'
    });
  }

  orderSubmissionLocks.add(lockKey);

  try {
    const {
      address_id,
      address_data,
      payment_method = 'COD',
      coupon_code,
      notes
    } = req.body;

    // 2. Locate active shopping cart
    let cart = null;
    if (userId) {
      cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(userId);
    } else if (sessionId) {
      cart = db.prepare('SELECT id FROM cart WHERE session_id = ?').get(sessionId);
    }

    if (!cart) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items to order.' });
    }

    const cartItems = db.prepare(`
      SELECT 
        ci.product_id,
        ci.quantity
      FROM cart_items ci
      WHERE ci.cart_id = ?
    `).all(cart.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Add fireworks to proceed.' });
    }

    // 3. ZERO-TRUST PRICE & STOCK VALIDATION (Fetch fresh data from database)
    const verifiedOrderItems = [];
    let backendSubtotal = 0;

    const getProductStmt = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.mrp,
        p.stock,
        p.is_active,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
      FROM products p
      WHERE p.id = ?
    `);

    for (const item of cartItems) {
      const product = getProductStmt.get(item.product_id);

      if (!product || !product.is_active) {
        return res.status(400).json({
          success: false,
          message: `Item in cart is currently unavailable or discontinued.`
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid item quantity for "${product.name}".`
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for "${product.name}". Only ${product.stock} units left in stock.`
        });
      }

      const itemTotalPrice = product.price * item.quantity;
      backendSubtotal += itemTotalPrice;

      verifiedOrderItems.push({
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity: item.quantity,
        total_price: itemTotalPrice,
        image_url: product.image_url || ''
      });
    }

    // 4. Resolve & Snapshot Delivery Address (Full snapshot so edits never alter historical records)
    let addressSnapshot = '';
    let addressId = null;

    if (address_id) {
      // Must be authorized to use this address
      let addr = null;
      if (userId) {
        addr = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, userId);
      } else {
        addr = db.prepare('SELECT * FROM addresses WHERE id = ?').get(address_id);
      }

      if (!addr) {
        return res.status(400).json({ success: false, message: 'Selected delivery address not found.' });
      }

      addressId = addr.id;
      addressSnapshot = JSON.stringify({
        fullName: addr.full_name,
        phone: addr.phone,
        altPhone: addr.alt_phone || null,
        houseBuilding: addr.house_building || addr.street || '',
        streetArea: addr.street_area || addr.street || '',
        landmark: addr.landmark || '',
        city: addr.city,
        district: addr.district || addr.city,
        state: addr.state || 'Tamil Nadu',
        pincode: addr.pincode
      });
    } else if (address_data) {
      const {
        full_name,
        phone,
        alt_phone,
        house_building,
        street_area,
        street,
        landmark,
        city,
        district,
        state,
        pincode
      } = address_data;

      const effectiveHouse = (house_building || street || '').trim();
      const effectiveStreet = (street_area || street || '').trim();
      const effectiveDistrict = (district || city || '').trim();

      if (!full_name || !phone || !effectiveHouse || !city || !pincode) {
        return res.status(400).json({
          success: false,
          message: 'Please provide all required delivery address fields.'
        });
      }

      const cleanPin = pincode.toString().trim();
      if (!/^\d{6}$/.test(cleanPin)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit postal pincode.' });
      }

      addressSnapshot = JSON.stringify({
        fullName: full_name.trim(),
        phone: phone.trim(),
        altPhone: alt_phone ? alt_phone.trim() : null,
        houseBuilding: effectiveHouse,
        streetArea: effectiveStreet,
        landmark: landmark ? landmark.trim() : '',
        city: city.trim(),
        district: effectiveDistrict,
        state: state ? state.trim() : 'Tamil Nadu',
        pincode: cleanPin
      });
    } else {
      return res.status(400).json({ success: false, message: 'Delivery address is required to place an order.' });
    }

    // 5. Server-Side Discount & Delivery Calculation
    let discount = 0;
    let appliedCoupon = null;

    if (coupon_code) {
      const code = coupon_code.trim().toUpperCase();
      try {
        const dbCoupon = db.prepare(`
          SELECT * FROM coupons 
          WHERE code = ? AND is_active = 1 
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        `).get(code);

        if (dbCoupon) {
          if (!dbCoupon.min_order_amount || backendSubtotal >= dbCoupon.min_order_amount) {
            if (dbCoupon.discount_type === 'flat') {
              discount = dbCoupon.discount_value;
            } else {
              discount = Math.round(backendSubtotal * (dbCoupon.discount_value / 100));
              if (dbCoupon.max_discount_amount && discount > dbCoupon.max_discount_amount) {
                discount = dbCoupon.max_discount_amount;
              }
            }
            appliedCoupon = dbCoupon.code;
          }
        }
      } catch (e) {
        // Fallback if coupon table query has issue
      }

      if (!appliedCoupon) {
        if (code === 'DIWALI2026') {
          if (backendSubtotal >= 1500) {
            discount = 200;
            appliedCoupon = 'DIWALI2026';
          }
        } else if (code === 'FESTIVE10') {
          discount = Math.round(backendSubtotal * 0.10);
          appliedCoupon = 'FESTIVE10';
        } else if (code === 'FLASHSALE') {
          discount = Math.round(backendSubtotal * 0.15);
          appliedCoupon = 'FLASHSALE';
        }
      }
    }

    const effectiveSubtotal = Math.max(0, backendSubtotal - discount);
    // Fragile transport charge: Free on orders >= ₹1999, else ₹150
    const deliveryCharge = effectiveSubtotal >= 1999 ? 0 : 150;
    const grandTotal = Math.max(0, effectiveSubtotal + deliveryCharge);

    const orderNumber = generateOrderNumber();
    const trackingNumber = `TRK-${orderNumber}`;

    // Status Enums:
    // UPI orders start as 'pending_payment' until customer submits payment details,
    // after which it moves to 'payment_verification' pending admin verification.
    const isUpi = payment_method === 'UPI';
    const initialOrderStatus = isUpi ? 'pending_payment' : 'confirmed';
    const initialPaymentStatus = 'pending';

    const shopUpiId = db.getSetting('shop_upi_id', process.env.UPI_ID || 'YOUR_UPI_ID@upi');
    const shopName = db.getSetting('shop_name', process.env.SHOP_NAME || 'Blast Crackers Sivakasi');

    // 6. Atomic Transaction: Insert Order, Order Items, Payment, Decrement Stock, Clear Cart
    const placeOrderTx = db.transaction(() => {
      // Insert Order
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, address_id, address_snapshot,
          subtotal, discount, coupon_code, delivery_charge, grand_total,
          status, tracking_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const orderResult = insertOrder.run(
        orderNumber,
        userId,
        addressId,
        addressSnapshot,
        backendSubtotal,
        discount,
        appliedCoupon,
        deliveryCharge,
        grandTotal,
        initialOrderStatus,
        trackingNumber,
        notes || 'Festive fireworks consignment - moisture-proof pack'
      );
      const newOrderId = orderResult.lastInsertRowid;

      // Insert Order Items & decrement stock
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const decrementStock = db.prepare(`
        UPDATE products 
        SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      for (const item of verifiedOrderItems) {
        insertItem.run(
          newOrderId,
          item.product_id,
          item.product_name,
          item.price,
          item.quantity,
          item.total_price,
          item.image_url
        );
        decrementStock.run(item.quantity, item.product_id);
      }

      // Record Payment in payments table
      const txId = payment_method === 'COD' 
        ? `COD-${Date.now()}` 
        : `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      db.prepare(`
        INSERT INTO payments (
          order_id, customer_id, payment_method, payment_status,
          upi_id, amount, currency, transaction_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'INR', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        newOrderId,
        userId,
        payment_method,
        initialPaymentStatus,
        isUpi ? shopUpiId : null,
        grandTotal,
        txId
      );

      // Clear the user's cart
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

      return newOrderId;
    });

    const createdOrderId = placeOrderTx();

    // Record initial timeline event
    try {
      if (isUpi) {
        db.addOrderTimelineEvent(
          createdOrderId,
          'pending_payment',
          'Order Placed (Payment Pending)',
          'Festive crackers order placed successfully. Awaiting customer UPI payment scan and UTR submission.',
          req.user ? req.user.name : 'Customer'
        );
      } else {
        db.addOrderTimelineEvent(
          createdOrderId,
          'confirmed',
          'Order Placed & Confirmed',
          'Festive crackers order confirmed with Cash on Delivery (COD).',
          req.user ? req.user.name : 'Customer'
        );
      }

      notificationService.notify('order_placed', {
        orderId: createdOrderId,
        orderNumber,
        amount: grandTotal,
        customerName: req.user ? req.user.name : 'Customer'
      });
    } catch (timelineErr) {
      console.error('Failed to log order placement event:', timelineErr);
    }

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(createdOrderId);
    const orderItemsPlaced = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(createdOrderId);

    const upiUri = isUpi ? buildUpiUri(shopUpiId, shopName, grandTotal, orderNumber) : null;
    const requireUtr = db.getSetting('require_utr', 'true') === 'true';
    const expiryMinutes = parseInt(db.getSetting('payment_expiry_minutes', '15'), 10) || 15;

    return res.status(201).json({
      success: true,
      message: isUpi
        ? 'Order created. Please complete payment using the dynamic UPI QR code.'
        : 'Your crackers order has been confirmed successfully! 🎆',
      order: createdOrder,
      items: orderItemsPlaced,
      order_number: orderNumber,
      tracking_number: trackingNumber,
      upi_details: isUpi ? {
        upi_id: shopUpiId,
        shop_upi_id: shopUpiId,
        shop_name: shopName,
        amount: grandTotal,
        currency: 'INR',
        upi_uri: upiUri,
        require_utr: requireUtr,
        payment_expiry_minutes: expiryMinutes,
        expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
      } : null
    });
  } catch (err) {
    console.error('Order creation transaction error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to place order due to a server error. Your cart has been preserved. Please try again.'
    });
  } finally {
    orderSubmissionLocks.delete(lockKey);
  }
});

// GET /api/orders/my-orders - Authenticated user orders list (Secure customer isolation)
router.get('/my-orders', authRequired, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT 
        o.*,
        p.payment_method,
        p.payment_status,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as total_items
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(ord => ({
      ...ord,
      items: getItems.all(ord.id),
      parsed_address: JSON.parse(ord.address_snapshot || '{}')
    }));

    res.json({
      success: true,
      orders: enrichedOrders
    });
  } catch (err) {
    console.error('Fetch my-orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve orders.' });
  }
});

// GET /api/orders/:orderNumber/payment - Idempotent Payment Info for Checkout & Refresh
router.get('/:orderNumber/payment', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found.' });
    }

    if (req.user && order.user_id && req.user.role !== 'admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this order payment.' });
    }

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const shopUpiId = db.getSetting('shop_upi_id', process.env.UPI_ID || 'YOUR_UPI_ID@upi');
    const shopName = db.getSetting('shop_name', process.env.SHOP_NAME || 'Blast Crackers Sivakasi');
    const requireUtr = db.getSetting('require_utr', 'true') === 'true';
    const expiryMinutes = parseInt(db.getSetting('payment_expiry_minutes', '15'), 10) || 15;

    const createdAtTime = parseSqliteDate(order.created_at);
    const isExpired = (Date.now() - createdAtTime) > (expiryMinutes * 60 * 1000) && payment.payment_status === 'pending';

    const upiUri = buildUpiUri(shopUpiId, shopName, order.grand_total, order.order_number);
    const expiresAt = new Date(createdAtTime + expiryMinutes * 60 * 1000).toISOString();

    res.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        grand_total: order.grand_total,
        status: order.status,
        created_at: order.created_at
      },
      payment: {
        id: payment.id,
        method: payment.payment_method,
        status: payment.payment_status,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        upi_id: payment.upi_id || shopUpiId,
        transaction_reference: payment.transaction_reference,
        customer_submitted_at: payment.customer_submitted_at,
        verified_at: payment.verified_at
      },
      upi_details: {
        shop_upi_id: shopUpiId,
        shop_name: shopName,
        amount: order.grand_total,
        currency: 'INR',
        upi_uri: upiUri,
        require_utr: requireUtr,
        payment_expiry_minutes: expiryMinutes,
        is_expired: isExpired,
        expires_at: expiresAt
      }
    });
  } catch (err) {
    console.error('Fetch payment info error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment information.' });
  }
});

// POST /api/orders/:orderNumber/submit-payment - Customer clicks [I HAVE COMPLETED PAYMENT]
router.post('/:orderNumber/submit-payment', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { transaction_reference, notes } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found.' });
    }

    if (req.user && order.user_id && req.user.role !== 'admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to submit payment for this order.' });
    }

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found for this order.' });
    }

    // Never overwrite already confirmed/paid payments
    if (payment.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This payment has already been verified and confirmed.'
      });
    }

    // Configurable Payment Session Expiry Check
    const expiryMinutes = parseInt(db.getSetting('payment_expiry_minutes', '15'), 10) || 15;
    const createdAtTime = parseSqliteDate(order.created_at);
    if ((Date.now() - createdAtTime) > (expiryMinutes * 60 * 1000) && payment.payment_status === 'pending') {
      return res.status(410).json({
        success: false,
        message: `The ${expiryMinutes}-minute payment window for this order has expired. Please place a new order or contact customer care.`
      });
    }

    // UTR Validation based on business configuration
    const requireUtr = db.getSetting('require_utr', 'true') === 'true';
    const cleanUtr = transaction_reference ? String(transaction_reference).trim() : '';

    if (requireUtr && !cleanUtr) {
      return res.status(400).json({
        success: false,
        message: 'UPI Transaction ID / 12-digit UTR Number is required by the merchant to verify payment.'
      });
    }

    if (cleanUtr) {
      // Validate reasonable 12-digit or 12-character alphanumeric format
      if (cleanUtr.length !== 12 || !/^[A-Za-z0-9]{12}$/.test(cleanUtr)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UPI Transaction ID. A valid UTR number must be exactly 12 alphanumeric characters (e.g. 428178129012).'
        });
      }
    }

    // Real-world rule: Transition to "submitted" / "payment_verification", NOT "paid"
    db.prepare(`
      UPDATE payments 
      SET payment_status = 'submitted',
          transaction_reference = ?,
          customer_submitted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(cleanUtr || null, payment.id);

    db.prepare(`
      UPDATE orders
      SET status = 'payment_verification',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order.id);

    try {
      db.addOrderTimelineEvent(
        order.id,
        'payment_verification',
        'Payment Details Submitted',
        `Customer submitted UPI reference UTR: ${cleanUtr || 'N/A'}. Awaiting warehouse verification.`,
        req.user ? req.user.name : 'Customer'
      );

      notificationService.notify('payment_submitted', {
        orderId: order.id,
        orderNumber: order.order_number,
        amount: order.grand_total,
        notes: `UTR: ${cleanUtr || 'N/A'}`
      });
    } catch (e) {
      console.error('Failed to log payment submission timeline event:', e);
    }

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id);

    res.json({
      success: true,
      message: 'Payment details submitted successfully. Your order will be confirmed after payment verification.',
      order: updatedOrder,
      payment: updatedPayment
    });
  } catch (err) {
    console.error('Submit payment error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit payment details.' });
  }
});

// GET /api/orders/track/:orderNumber - Order tracking with step timeline
router.get('/track/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = db.prepare(`
      SELECT 
        o.*,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.customer_submitted_at
      FROM orders o
      LEFT JOIN payments p ON p.order_id = o.id
      WHERE o.order_number = ? OR o.tracking_number = ?
    `).get(orderNumber.trim(), orderNumber.trim());

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found.' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    // Timeline mapping for Order Status Enum
    const isPaymentPending = order.status === 'pending_payment';
    const isUnderVerification = order.status === 'payment_verification';

    const statusOrder = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const normalizedStatus = order.status === 'dispatched' ? 'shipped' : order.status;
    const currentIdx = statusOrder.indexOf(normalizedStatus);

    const timeline = [];

    if (order.payment_method === 'UPI' && (isPaymentPending || isUnderVerification)) {
      timeline.push({
        stage: 'Payment Submission',
        description: isUnderVerification 
          ? `UPI Payment submitted (UTR: ${order.transaction_reference || 'Submitted'}). Awaiting warehouse verification.`
          : 'Pending UPI QR payment scan by customer.',
        completed: isUnderVerification,
        active: true
      });
      timeline.push({
        stage: 'Payment Verification & Order Confirmation',
        description: 'Store manager verifies bank credit before packing fireworks.',
        completed: false,
        active: false
      });
    } else {
      timeline.push({
        stage: 'Order Confirmed',
        description: 'Order safety-verified by Sivakasi team',
        completed: currentIdx >= 0,
        active: currentIdx === 0
      });
    }

    timeline.push(
      {
        stage: 'Processing at Depot',
        description: 'Quality inspected and sorted from Sivakasi factory',
        completed: currentIdx >= 1,
        active: currentIdx === 1
      },
      {
        stage: 'Packed & Sealed',
        description: 'Moisture-proof tamper-evident explosive-safe packaging',
        completed: currentIdx >= 2,
        active: currentIdx === 2
      },
      {
        stage: 'Shipped via Express',
        description: 'Handed over to licensed fireworks transport logistics',
        completed: currentIdx >= 3,
        active: currentIdx === 3
      },
      {
        stage: 'Out for Delivery',
        description: 'Courier partner is en route to your shipping address',
        completed: currentIdx >= 4,
        active: currentIdx === 4
      },
      {
        stage: 'Delivered',
        description: 'Consignment delivered safely. Have a sparkling celebration!',
        completed: currentIdx >= 5,
        active: currentIdx === 5
      }
    );

    const events = db.getOrderTimeline(order.id);

    res.json({
      success: true,
      order: {
        ...order,
        items,
        parsed_address: JSON.parse(order.address_snapshot || '{}')
      },
      timeline,
      events
    });
  } catch (err) {
    console.error('Order tracking error:', err);
    res.status(500).json({ success: false, message: 'Failed to track order.' });
  }
});

// GET /api/orders/:orderNumber/detail - Comprehensive order detail with timeline
router.get('/:orderNumber/detail', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found.' });
    }

    // Security check: Customer isolation
    if (order.user_id) {
      if (!req.user || (req.user.id !== order.user_id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this order details.' });
      }
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);
    const timeline = db.getOrderTimeline(order.id);

    res.json({
      success: true,
      order: {
        ...order,
        items,
        payment,
        parsed_address: JSON.parse(order.address_snapshot || '{}'),
        timeline
      }
    });
  } catch (err) {
    console.error('Fetch order detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
});

// POST /api/orders/:orderNumber/cancel - Customer self-cancellation
router.post('/:orderNumber/cancel', optionalAuth, (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber.trim());
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Security check: Customer isolation
    if (order.user_id) {
      if (!req.user || (req.user.id !== order.user_id && req.user.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this order.' });
      }
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This order is already cancelled.' });
    }

    // Customer cancellation constraint: only prior to packing/processing
    const cancellableStatuses = ['pending_payment', 'payment_verification', 'confirmed'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'This order is already in fulfillment or dispatched and cannot be cancelled online. Please contact support.'
      });
    }

    const cancelTx = db.transaction(() => {
      // 1. Restore product inventory
      const items = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').all(order.id);
      const restoreStock = db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

      for (const item of items) {
        restoreStock.run(item.quantity, item.product_id);
      }

      // 2. Update order status
      db.prepare(`
        UPDATE orders
        SET status = 'cancelled',
            cancellation_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason || 'Cancelled by customer', order.id);

      // 3. Update payment status if pending or under verification
      db.prepare(`
        UPDATE payments
        SET payment_status = 'failed',
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ? AND payment_status IN ('pending', 'submitted', 'under_verification')
      `).run(order.id);

      // 4. Record timeline event
      db.addOrderTimelineEvent(
        order.id,
        'cancelled',
        'Order Cancelled by Customer',
        `Customer requested cancellation: ${reason || 'Customer cancellation'}. Reserved stock returned to inventory.`,
        req.user ? req.user.name : 'Customer'
      );
    });

    cancelTx();

    notificationService.notify('order_cancelled', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.grand_total,
      notes: reason || 'Cancelled by customer'
    });

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);

    res.json({
      success: true,
      message: `Order ${order.order_number} has been cancelled successfully.`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
});

module.exports = router;
