const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { adminRequired } = require('../middleware/auth');

// GET /api/settings/payment - Public endpoint returning store UPI payment configuration
router.get('/payment', (req, res) => {
  try {
    const shopUpiId = db.getSetting('shop_upi_id', process.env.UPI_ID || 'YOUR_UPI_ID@upi');
    const shopName = db.getSetting('shop_name', process.env.SHOP_NAME || 'Blast Crackers Sivakasi');
    const instructions = db.getSetting('payment_instructions', 'Scan the dynamic QR code with any UPI app (GPay, PhonePe, Paytm, BHIM). After transferring, click I Have Completed Payment and enter the 12-digit UTR number.');
    const requireUtr = db.getSetting('require_utr', 'true') === 'true';
    const expiryMinutes = parseInt(db.getSetting('payment_expiry_minutes', '15'), 10) || 15;

    res.json({
      success: true,
      settings: {
        shop_upi_id: shopUpiId,
        shop_name: shopName,
        payment_instructions: instructions,
        require_utr: requireUtr,
        payment_expiry_minutes: expiryMinutes
      }
    });
  } catch (err) {
    console.error('Fetch payment settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment configuration.' });
  }
});

// GET /api/settings/admin - Admin endpoint returning all settings
router.get('/admin', adminRequired, (req, res) => {
  try {
    const all = db.getAllSettings();
    res.json({
      success: true,
      settings: all
    });
  } catch (err) {
    console.error('Fetch admin settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve admin settings.' });
  }
});

// PUT /api/settings/admin - Admin endpoint to update store and UPI configuration
router.put('/admin', adminRequired, (req, res) => {
  try {
    const {
      shop_upi_id,
      shop_name,
      payment_instructions,
      require_utr,
      payment_expiry_minutes
    } = req.body;

    if (shop_upi_id !== undefined) {
      const cleanUpi = shop_upi_id.trim();
      if (!cleanUpi.includes('@') || cleanUpi.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UPI ID format. Must contain a username and handle (e.g. yourname@upi).'
        });
      }
      db.setSetting('shop_upi_id', cleanUpi);
    }

    if (shop_name !== undefined) {
      db.setSetting('shop_name', shop_name.trim());
    }

    if (payment_instructions !== undefined) {
      db.setSetting('payment_instructions', payment_instructions.trim());
    }

    if (require_utr !== undefined) {
      db.setSetting('require_utr', require_utr ? 'true' : 'false');
    }

    if (payment_expiry_minutes !== undefined) {
      const mins = parseInt(payment_expiry_minutes, 10);
      if (isNaN(mins) || mins < 1 || mins > 1440) {
        return res.status(400).json({
          success: false,
          message: 'Payment expiry minutes must be between 1 and 1440.'
        });
      }
      db.setSetting('payment_expiry_minutes', mins.toString());
    }

    res.json({
      success: true,
      message: 'Store payment configuration updated successfully.',
      settings: db.getAllSettings()
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

module.exports = router;
