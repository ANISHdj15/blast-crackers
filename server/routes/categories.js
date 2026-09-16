const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { adminRequired } = require('../middleware/auth');

// GET /api/categories - Public list with product counts
router.get('/', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// POST /api/categories - Admin create
router.post('/', adminRequired, (req, res) => {
  try {
    const { name, description, icon, image_url, sort_order } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
    }

    const stmt = db.prepare(`
      INSERT INTO categories (name, slug, description, icon, image_url, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(name.trim(), slug, description || '', icon || 'Sparkles', image_url || '', sort_order || 0);

    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category: newCategory
    });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// PUT /api/categories/:id - Admin update
router.put('/:id', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, image_url, sort_order, is_active } = req.body;

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const updatedName = name ? name.trim() : category.name;
    const updatedSlug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : category.slug;

    db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, description = ?, icon = ?, image_url = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `).run(
      updatedName,
      updatedSlug,
      description !== undefined ? description : category.description,
      icon !== undefined ? icon : category.icon,
      image_url !== undefined ? image_url : category.image_url,
      sort_order !== undefined ? sort_order : category.sort_order,
      is_active !== undefined ? is_active : category.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Category updated successfully.',
      category: updated
    });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

// GET /api/categories/admin/all - Admin list all categories including inactive
router.get('/admin/all', adminRequired, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `).all();

    res.json({
      success: true,
      categories
    });
  } catch (err) {
    console.error('Fetch admin categories error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin categories.' });
  }
});

// DELETE /api/categories/:id - Admin delete
router.delete('/:id', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

// PATCH /api/categories/:id/toggle-active - Admin toggle category active status
router.patch('/:id/toggle-active', adminRequired, (req, res) => {
  try {
    const { id } = req.params;
    const cat = db.prepare('SELECT id, is_active, name FROM categories WHERE id = ?').get(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const newActive = cat.is_active ? 0 : 1;
    db.prepare('UPDATE categories SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newActive, id);

    res.json({
      success: true,
      message: `Category "${cat.name}" is now ${newActive ? 'active' : 'inactive'}.`,
      is_active: newActive
    });
  } catch (err) {
    console.error('Toggle category error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle category.' });
  }
});

module.exports = router;
