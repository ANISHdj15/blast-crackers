const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// Helper to get or create cart for user or guest session
function getOrCreateCart(userId, sessionId) {
  if (userId) {
    let cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(userId);
    if (!cart) {
      const result = db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(userId);
      cart = db.prepare('SELECT * FROM cart WHERE id = ?').get(result.lastInsertRowid);
    }
    return cart;
  } else if (sessionId) {
    let cart = db.prepare('SELECT * FROM cart WHERE session_id = ?').get(sessionId);
    if (!cart) {
      const result = db.prepare('INSERT INTO cart (session_id) VALUES (?)').run(sessionId);
      cart = db.prepare('SELECT * FROM cart WHERE id = ?').get(result.lastInsertRowid);
    }
    return cart;
  }
  return null;
}

// GET /api/cart
router.get('/', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.session_id;

    if (!userId && !sessionId) {
      return res.json({ success: true, items: [], subtotal: 0, total_items: 0 });
    }

    const cart = getOrCreateCart(userId, sessionId);
    if (!cart) {
      return res.json({ success: true, items: [], subtotal: 0, total_items: 0 });
    }

    const items = db.prepare(`
      SELECT 
        ci.id as cart_item_id,
        ci.quantity,
        ci.created_at as added_at,
        p.id as product_id,
        p.name,
        p.slug,
        p.price,
        p.mrp,
        p.discount_percent,
        p.stock,
        p.unit,
        p.sound_level,
        p.piece_count,
        (ci.quantity * p.price) as item_total,
        (ci.quantity * p.mrp) as item_mrp_total,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as image_url
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ? AND p.is_active = 1
      ORDER BY ci.created_at DESC
    `).all(cart.id);

    let subtotal = 0;
    let mrpTotal = 0;
    let totalItems = 0;

    items.forEach(item => {
      subtotal += item.item_total;
      mrpTotal += item.item_mrp_total;
      totalItems += item.quantity;
    });

    const savings = Math.max(0, mrpTotal - subtotal);

    res.json({
      success: true,
      cart_id: cart.id,
      items,
      subtotal,
      mrp_total: mrpTotal,
      savings,
      total_items: totalItems
    });
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch cart.' });
  }
});

// POST /api/cart/add
router.post('/add', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.session_id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    if (!userId && !sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID or user token required.' });
    }

    const product = db.prepare('SELECT id, name, price, stock, is_active FROM products WHERE id = ?').get(product_id);
    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Product not found or currently unavailable.' });
    }

    const cart = getOrCreateCart(userId, sessionId);

    const existingItem = db.prepare('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cart.id, product.id);
    const newQuantity = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    if (existingItem) {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQuantity, existingItem.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)').run(cart.id, product.id, newQuantity);
    }

    db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);

    res.json({
      success: true,
      message: `${product.name} added to cart.`,
      cart_id: cart.id
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
});

// PUT /api/cart/update
router.put('/update', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.session_id;
    const { product_id, quantity } = req.body;

    if (!product_id || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required.' });
    }

    const cart = getOrCreateCart(userId, sessionId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?').run(cart.id, product_id);
      return res.json({ success: true, message: 'Item removed from cart.' });
    }

    const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(product_id);
    if (product && qty > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units available in stock.` });
    }

    db.prepare(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(cart_id, product_id) DO UPDATE SET quantity = ?
    `).run(cart.id, product_id, qty, qty);

    db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);

    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to update cart.' });
  }
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.session_id;
    const { productId } = req.params;

    const cart = getOrCreateCart(userId, sessionId);
    if (cart) {
      db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?').run(cart.id, productId);
      db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);
    }

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Remove cart item error:', err);
    res.status(500).json({ success: false, message: 'Failed to remove item.' });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', optionalAuth, (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.query.session_id;

    const cart = getOrCreateCart(userId, sessionId);
    if (cart) {
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
      db.prepare('UPDATE cart SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(cart.id);
    }

    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
});

// POST /api/cart/sync - Merge guest cart items into user cart when user logs in
router.post('/sync', optionalAuth, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required to sync cart.' });
    }

    const { session_id } = req.body;
    if (!session_id) {
      return res.json({ success: true, message: 'No guest session to sync.' });
    }

    const guestCart = db.prepare('SELECT id FROM cart WHERE session_id = ?').get(session_id);
    if (!guestCart) {
      return res.json({ success: true, message: 'Guest cart was empty.' });
    }

    const userCart = getOrCreateCart(req.user.id, null);
    const guestItems = db.prepare('SELECT product_id, quantity FROM cart_items WHERE cart_id = ?').all(guestCart.id);

    const mergeItem = db.prepare(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + excluded.quantity
    `);

    guestItems.forEach(item => {
      mergeItem.run(userCart.id, item.product_id, item.quantity);
    });

    // Delete guest cart
    db.prepare('DELETE FROM cart WHERE id = ?').run(guestCart.id);

    res.json({ success: true, message: 'Guest cart merged successfully.' });
  } catch (err) {
    console.error('Sync cart error:', err);
    res.status(500).json({ success: false, message: 'Failed to sync cart.' });
  }
});

module.exports = router;
