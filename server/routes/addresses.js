const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authRequired } = require('../middleware/auth');

// All address routes require customer authentication
router.use(authRequired);

// Helper function to validate address fields
function validateAddressData(data) {
  const errors = [];
  const {
    full_name,
    phone,
    house_building,
    street_area,
    city,
    district,
    state,
    pincode,
    alt_phone
  } = data;

  if (!full_name || full_name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  }

  const cleanPhone = phone ? phone.replace(/[\s\-+]/g, '') : '';
  if (!cleanPhone || cleanPhone.length < 10) {
    errors.push('A valid 10-digit mobile number is required.');
  }

  if (!house_building || house_building.trim().length < 1) {
    errors.push('House / Flat / Building details are required.');
  }

  if (!street_area || street_area.trim().length < 2) {
    errors.push('Street / Locality / Area is required.');
  }

  if (!city || city.trim().length < 2) {
    errors.push('City / Town is required.');
  }

  if (!district || district.trim().length < 2) {
    errors.push('District is required.');
  }

  if (!state || state.trim().length < 2) {
    errors.push('State is required.');
  }

  const cleanPin = pincode ? pincode.trim() : '';
  if (!cleanPin || !/^\d{6}$/.test(cleanPin)) {
    errors.push('A valid 6-digit postal pincode is required.');
  }

  if (alt_phone && alt_phone.trim()) {
    const cleanAlt = alt_phone.replace(/[\s\-+]/g, '');
    if (cleanAlt.length < 10) {
      errors.push('Alternate phone must be at least 10 digits.');
    }
  }

  return errors;
}

// GET /api/addresses - List all saved addresses of authenticated user
router.get('/', (req, res) => {
  try {
    const addresses = db.prepare(`
      SELECT 
        id,
        user_id,
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
        pincode,
        is_default,
        created_at,
        updated_at
      FROM addresses
      WHERE user_id = ?
      ORDER BY is_default DESC, id DESC
    `).all(req.user.id);

    // Normalize street_area / house_building fallback from legacy street if empty
    const normalized = addresses.map(addr => ({
      ...addr,
      house_building: addr.house_building || addr.street || '',
      street_area: addr.street_area || addr.street || '',
      district: addr.district || addr.city || 'Madurai'
    }));

    res.json({
      success: true,
      addresses: normalized
    });
  } catch (err) {
    console.error('Fetch addresses error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve addresses.' });
  }
});

// POST /api/addresses - Create new address
router.post('/', (req, res) => {
  try {
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
      pincode,
      is_default
    } = req.body;

    const effectiveHouse = (house_building || street || '').trim();
    const effectiveStreet = (street_area || street || '').trim();
    const effectiveDistrict = (district || city || '').trim();

    const errors = validateAddressData({
      full_name,
      phone,
      alt_phone,
      house_building: effectiveHouse,
      street_area: effectiveStreet,
      city,
      district: effectiveDistrict,
      state: state || 'Tamil Nadu',
      pincode
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    // Check existing address count for this customer
    const countRow = db.prepare('SELECT COUNT(*) as total FROM addresses WHERE user_id = ?').get(req.user.id);
    const shouldBeDefault = countRow.total === 0 ? 1 : (is_default ? 1 : 0);

    if (shouldBeDefault) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const legacyStreet = `${effectiveHouse}, ${effectiveStreet}`;

    const stmt = db.prepare(`
      INSERT INTO addresses (
        user_id, full_name, phone, alt_phone, house_building,
        street_area, street, landmark, city, district, state, pincode, is_default
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      full_name.trim(),
      phone.trim(),
      alt_phone ? alt_phone.trim() : null,
      effectiveHouse,
      effectiveStreet,
      legacyStreet,
      landmark ? landmark.trim() : null,
      city.trim(),
      effectiveDistrict,
      (state || 'Tamil Nadu').trim(),
      pincode.trim(),
      shouldBeDefault
    );

    const newAddress = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Address saved to address book.',
      address: newAddress
    });
  } catch (err) {
    console.error('Create address error:', err);
    res.status(500).json({ success: false, message: 'Failed to create address.' });
  }
});

// PUT /api/addresses/:id - Update an address
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
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
      pincode,
      is_default
    } = req.body;

    // Strict ownership verification
    const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found or access denied.' });
    }

    const effectiveHouse = (house_building || existing.house_building || street || existing.street || '').trim();
    const effectiveStreet = (street_area || existing.street_area || street || existing.street || '').trim();
    const effectiveDistrict = (district || existing.district || city || existing.city || '').trim();

    const errors = validateAddressData({
      full_name: full_name || existing.full_name,
      phone: phone || existing.phone,
      alt_phone: alt_phone !== undefined ? alt_phone : existing.alt_phone,
      house_building: effectiveHouse,
      street_area: effectiveStreet,
      city: city || existing.city,
      district: effectiveDistrict,
      state: state || existing.state || 'Tamil Nadu',
      pincode: pincode || existing.pincode
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const legacyStreet = `${effectiveHouse}, ${effectiveStreet}`;

    db.prepare(`
      UPDATE addresses
      SET full_name = ?,
          phone = ?,
          alt_phone = ?,
          house_building = ?,
          street_area = ?,
          street = ?,
          landmark = ?,
          city = ?,
          district = ?,
          state = ?,
          pincode = ?,
          is_default = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      full_name ? full_name.trim() : existing.full_name,
      phone ? phone.trim() : existing.phone,
      alt_phone !== undefined ? (alt_phone ? alt_phone.trim() : null) : existing.alt_phone,
      effectiveHouse,
      effectiveStreet,
      legacyStreet,
      landmark !== undefined ? (landmark ? landmark.trim() : null) : existing.landmark,
      city ? city.trim() : existing.city,
      effectiveDistrict,
      state ? state.trim() : existing.state,
      pincode ? pincode.trim() : existing.pincode,
      is_default !== undefined ? (is_default ? 1 : 0) : existing.is_default,
      id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Address updated successfully.',
      address: updated
    });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ success: false, message: 'Failed to update address.' });
  }
});

// PATCH /api/addresses/:id/default - Set an address as default
router.patch('/:id/default', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    db.transaction(() => {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
      db.prepare('UPDATE addresses SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(id, req.user.id);
    })();

    res.json({
      success: true,
      message: 'Default address updated.',
      default_address_id: Number(id)
    });
  } catch (err) {
    console.error('Set default address error:', err);
    res.status(500).json({ success: false, message: 'Failed to set default address.' });
  }
});

// DELETE /api/addresses/:id - Delete an address
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, req.user.id);

      // If the deleted address was default, promote another address if one exists
      if (existing.is_default === 1) {
        const nextAddr = db.prepare('SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(req.user.id);
        if (nextAddr) {
          db.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').run(nextAddr.id);
        }
      }
    })();

    res.json({
      success: true,
      message: 'Address deleted from address book.'
    });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete address.' });
  }
});

module.exports = router;
