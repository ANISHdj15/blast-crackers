const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { adminRequired } = require('../middleware/auth');

// GET /api/products - Browse, search, filter, sort
router.get('/', (req, res) => {
  try {
    const {
      category,
      search,
      min_price,
      max_price,
      sound_level,
      in_stock,
      is_featured,
      is_offer,
      is_latest,
      sort
    } = req.query;

    let sql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category) {
      if (!isNaN(category)) {
        sql += ` AND p.category_id = ?`;
        params.push(Number(category));
      } else {
        sql += ` AND c.slug = ?`;
        params.push(category);
      }
    }

    if (search) {
      sql += ` AND (p.name LIKE ? OR p.short_desc LIKE ? OR p.description LIKE ?)`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (min_price && !isNaN(min_price)) {
      sql += ` AND p.price >= ?`;
      params.push(Number(min_price));
    }

    if (max_price && !isNaN(max_price)) {
      sql += ` AND p.price <= ?`;
      params.push(Number(max_price));
    }

    if (sound_level) {
      sql += ` AND p.sound_level = ?`;
      params.push(sound_level);
    }

    if (in_stock === '1' || in_stock === 'true') {
      sql += ` AND p.stock > 0`;
    }

    if (is_featured === '1' || is_featured === 'true') {
      sql += ` AND p.is_featured = 1`;
    }

    if (is_offer === '1' || is_offer === 'true') {
      sql += ` AND p.is_offer = 1`;
    }

    if (is_latest === '1' || is_latest === 'true') {
      sql += ` AND p.is_latest = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'discount':
        sql += ` ORDER BY p.discount_percent DESC, p.price ASC`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      case 'featured':
      default:
        sql += ` ORDER BY p.is_featured DESC, p.is_offer DESC, p.id ASC`;
        break;
    }

    const products = db.prepare(sql).all(...params);

    res.json({
      success: true,
      total: products.length,
      products
    });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
});

// GET /api/products/admin/all - Admin list all products including inactive
router.get('/admin/all', adminRequired, (req, res) => {
  try {
    const products = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.id DESC
    `).all();

    res.json({
      success: true,
      total: products.length,
      products
    });
  } catch (err) {
    console.error('Fetch admin products error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin products.' });
  }
});

// GET /api/products/:identifier - Product detail by ID or Slug
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;

    let product;
    if (!isNaN(identifier)) {
      product = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.id = ? AND p.is_active = 1
      `).get(Number(identifier));
    } else {
      product = db.prepare(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        WHERE p.slug = ? AND p.is_active = 1
      `).get(identifier);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Get images
    const images = db.prepare(`
      SELECT * FROM product_images
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC
    `).all(product.id);

    product.images = images.length > 0 ? images : [{ image_url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80', is_primary: 1 }];

    // Get related products from same category
    const related = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
      ORDER BY p.is_featured DESC, p.id DESC
      LIMIT 4
    `).all(product.category_id, product.id);

    res.json({
      success: true,
      product,
      related
    });
  } catch (err) {
    console.error('Fetch product detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch product details.' });
  }
});

// POST /api/products - Admin create product
router.post('/', adminRequired, (req, res) => {
  try {
    const {
      category_id,
      name,
      short_desc,
      description,
      price,
      mrp,
      stock,
      unit,
      piece_count,
      sound_level,
      duration,
      safety_distance,
      is_featured,
      is_latest,
      is_offer,
      sku,
      image_url
    } = req.body;

    if (!category_id || !name || price === undefined || mrp === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category, product name, price, and MRP are required.'
      });
    }

    const numPrice = Number(price);
    const numMrp = Number(mrp);
    const discount = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);
    const productSku = sku && sku.trim() ? sku.trim().toUpperCase() : `BC-${Math.floor(1000 + Math.random() * 9000)}`;

    const stmt = db.prepare(`
      INSERT INTO products (
        category_id, name, slug, sku, short_desc, description, price, mrp,
        discount_percent, stock, unit, piece_count, sound_level, duration,
        safety_distance, is_featured, is_latest, is_offer, is_active
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 1
      )
    `);

    const result = stmt.run(
      Number(category_id),
      name.trim(),
      slug,
      productSku,
      short_desc || '',
      description || '',
      numPrice,
      numMrp,
      discount,
      stock ? Number(stock) : 0,
      unit || 'Box',
      piece_count ? Number(piece_count) : 1,
      sound_level || 'Medium',
      duration || '30 sec',
      safety_distance || '5 Meters',
      is_featured ? 1 : 0,
      is_latest ? 1 : 0,
      is_offer ? 1 : 0
    );

    const productId = result.lastInsertRowid;

    // Add image
    const imgUrl = image_url && image_url.trim() ? image_url.trim() : 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80';
    db.prepare(`
      INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
      VALUES (?, ?, 1, 0)
    `).run(productId, imgUrl);

    const createdProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: createdProduct
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
});

// PUT /api/products/:id - Admin update product
router.put('/:id', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      name,
      short_desc,
      description,
      price,
      mrp,
      stock,
      unit,
      piece_count,
      sound_level,
      duration,
      safety_distance,
      is_featured,
      is_latest,
      is_offer,
      is_active,
      sku,
      image_url
    } = req.body;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const numPrice = price !== undefined ? Number(price) : existing.price;
    const numMrp = mrp !== undefined ? Number(mrp) : existing.mrp;
    const discount = numMrp > numPrice ? Math.round(((numMrp - numPrice) / numMrp) * 100) : 0;

    db.prepare(`
      UPDATE products
      SET category_id = ?, name = ?, sku = ?, short_desc = ?, description = ?,
          price = ?, mrp = ?, discount_percent = ?, stock = ?,
          unit = ?, piece_count = ?, sound_level = ?, duration = ?,
          safety_distance = ?, is_featured = ?, is_latest = ?,
          is_offer = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      category_id !== undefined ? Number(category_id) : existing.category_id,
      name ? name.trim() : existing.name,
      sku !== undefined ? (sku ? sku.trim().toUpperCase() : existing.sku) : existing.sku,
      short_desc !== undefined ? short_desc : existing.short_desc,
      description !== undefined ? description : existing.description,
      numPrice,
      numMrp,
      discount,
      stock !== undefined ? Number(stock) : existing.stock,
      unit !== undefined ? unit : existing.unit,
      piece_count !== undefined ? Number(piece_count) : existing.piece_count,
      sound_level !== undefined ? sound_level : existing.sound_level,
      duration !== undefined ? duration : existing.duration,
      safety_distance !== undefined ? safety_distance : existing.safety_distance,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      is_latest !== undefined ? (is_latest ? 1 : 0) : existing.is_latest,
      is_offer !== undefined ? (is_offer ? 1 : 0) : existing.is_offer,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    if (image_url && image_url.trim()) {
      const existingImg = db.prepare('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1').get(id);
      if (existingImg) {
        db.prepare('UPDATE product_images SET image_url = ? WHERE id = ?').run(image_url.trim(), existingImg.id);
      } else {
        db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)').run(id, image_url.trim());
      }
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product: updated
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// PATCH /api/products/:id/stock - Admin quick update stock
router.patch('/:id/stock', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (stock === undefined || isNaN(stock)) {
      return res.status(400).json({ success: false, message: 'Valid stock count is required.' });
    }

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(stock), id);
    res.json({ success: true, message: 'Stock updated successfully.', stock: Number(stock) });
  } catch (err) {
    console.error('Stock update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update stock.' });
  }
});

// DELETE /api/products/:id - Admin soft delete
router.delete('/:id', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Product archived successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// PATCH /api/products/:id/toggle-active - Admin toggle product status
router.patch('/:id/toggle-active', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    const product = db.prepare('SELECT id, is_active, name FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const newActive = product.is_active ? 0 : 1;
    db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newActive, id);

    res.json({
      success: true,
      message: `Product "${product.name}" is now ${newActive ? 'active' : 'inactive'}.`,
      is_active: newActive
    });
  } catch (err) {
    console.error('Toggle product active error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle product status.' });
  }
});

module.exports = router;
