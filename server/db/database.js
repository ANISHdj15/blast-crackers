require('dotenv').config();
const path = require('path');
const fs = require('fs');

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const isPostgres = databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'));

if (isPostgres) {
  console.log('⚡ Initializing Cloud PostgreSQL database connection (Supabase / Render)...');
  const { createPostgresBridge } = require('./postgresBridge');
  const pgDb = createPostgresBridge(databaseUrl);
  module.exports = pgDb;
  return;
}

const Database = require('better-sqlite3');
const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'blast_crackers.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      alt_phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      short_desc TEXT,
      description TEXT,
      price REAL NOT NULL,
      mrp REAL NOT NULL,
      discount_percent INTEGER DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      unit TEXT DEFAULT 'Box', -- 'Box', 'Pack', 'Piece', 'Bundle'
      piece_count INTEGER DEFAULT 1,
      sound_level TEXT DEFAULT 'Medium', -- 'None', 'Low', 'Medium', 'High', 'Very High'
      duration TEXT DEFAULT '30s',
      safety_distance TEXT DEFAULT '5 Meters',
      is_featured INTEGER DEFAULT 0,
      is_latest INTEGER DEFAULT 0,
      is_offer INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    );

    -- Product Images table
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Carts table (supports both logged-in users and guest sessions)
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      session_id TEXT UNIQUE,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Cart Items table
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(cart_id, product_id),
      FOREIGN KEY (cart_id) REFERENCES cart (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
    );

    -- Addresses table with complete address book fields
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      alt_phone TEXT,
      house_building TEXT,
      street_area TEXT,
      street TEXT,
      landmark TEXT,
      city TEXT NOT NULL,
      district TEXT,
      state TEXT NOT NULL DEFAULT 'Tamil Nadu',
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      address_id INTEGER,
      address_snapshot TEXT NOT NULL, -- JSON string of historical shipping address
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      coupon_code TEXT,
      delivery_charge REAL DEFAULT 0,
      grand_total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed', -- 'pending_payment', 'payment_verification', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'
      tracking_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    );

    -- Order Items table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
    );

    -- Payments table
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_id INTEGER,
      payment_method TEXT NOT NULL, -- 'COD', 'UPI', 'CARD', 'NETBANKING'
      payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'under_verification', 'paid', 'failed', 'refunded'
      upi_id TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      transaction_id TEXT,
      transaction_reference TEXT,
      customer_submitted_at DATETIME,
      verified_at DATETIME,
      verified_by TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (customer_id) REFERENCES users (id) ON DELETE SET NULL
    );

    -- Settings table for store-wide configurable parameters (e.g. UPI ID, payment rules)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Timeline table for real-time tracking events
    CREATE TABLE IF NOT EXISTS order_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      created_by TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
    );

    -- Offers / Coupons table
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'flat'
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for fast queries
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id);
    CREATE INDEX IF NOT EXISTS idx_cart_session ON cart(session_id);
    CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
    CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline(order_id);
    CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(user_id);
  `);

  // Auto-migrate addresses table if existing database is missing newly required columns
  try {
    const addrTableInfo = db.prepare('PRAGMA table_info(addresses)').all();
    const existingAddrCols = new Set(addrTableInfo.map(col => col.name));

    if (!existingAddrCols.has('house_building')) {
      db.exec('ALTER TABLE addresses ADD COLUMN house_building TEXT');
    }
    if (!existingAddrCols.has('street_area')) {
      db.exec('ALTER TABLE addresses ADD COLUMN street_area TEXT');
    }
    if (!existingAddrCols.has('district')) {
      db.exec('ALTER TABLE addresses ADD COLUMN district TEXT');
    }
    if (!existingAddrCols.has('alt_phone')) {
      db.exec('ALTER TABLE addresses ADD COLUMN alt_phone TEXT');
    }
    if (!existingAddrCols.has('updated_at')) {
      db.exec('ALTER TABLE addresses ADD COLUMN updated_at DATETIME');
    }
  } catch (err) {
    console.warn('Address table migration warning:', err.message);
  }

  // Auto-migrate payments table if existing database is missing newly required columns
  try {
    const payTableInfo = db.prepare('PRAGMA table_info(payments)').all();
    const existingPayCols = new Set(payTableInfo.map(col => col.name));

    if (!existingPayCols.has('customer_id')) {
      db.exec('ALTER TABLE payments ADD COLUMN customer_id INTEGER');
    }
    if (!existingPayCols.has('currency')) {
      db.exec("ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'INR'");
    }
    if (!existingPayCols.has('upi_id')) {
      db.exec('ALTER TABLE payments ADD COLUMN upi_id TEXT');
    }
    if (!existingPayCols.has('transaction_reference')) {
      db.exec('ALTER TABLE payments ADD COLUMN transaction_reference TEXT');
    }
    if (!existingPayCols.has('customer_submitted_at')) {
      db.exec('ALTER TABLE payments ADD COLUMN customer_submitted_at DATETIME');
    }
    if (!existingPayCols.has('verified_at')) {
      db.exec('ALTER TABLE payments ADD COLUMN verified_at DATETIME');
    }
    if (!existingPayCols.has('verified_by')) {
      db.exec('ALTER TABLE payments ADD COLUMN verified_by TEXT');
    }
    if (!existingPayCols.has('updated_at')) {
      db.exec('ALTER TABLE payments ADD COLUMN updated_at DATETIME');
    }
  } catch (err) {
    console.warn('Payments migration warning:', err.message);
  }

  // Auto-migrate orders table for cancellation_reason
  try {
    const ordersTableInfo = db.prepare('PRAGMA table_info(orders)').all();
    const existingOrderCols = new Set(ordersTableInfo.map(col => col.name));
    if (!existingOrderCols.has('cancellation_reason')) {
      db.exec('ALTER TABLE orders ADD COLUMN cancellation_reason TEXT');
    }
  } catch (err) {
    console.warn('Orders table migration warning:', err.message);
  }

  // Auto-migrate products table for sku
  try {
    const productsTableInfo = db.prepare('PRAGMA table_info(products)').all();
    const existingProdCols = new Set(productsTableInfo.map(col => col.name));
    if (!existingProdCols.has('sku')) {
      db.exec('ALTER TABLE products ADD COLUMN sku TEXT');
      // Backfill existing products with readable SKU
      db.exec("UPDATE products SET sku = 'BC-' || (1000 + id) WHERE sku IS NULL");
    }
  } catch (err) {
    console.warn('Products table migration warning:', err.message);
  }

  // Seed default settings if not existing
  try {
    const defaultSettings = [
      { key: 'shop_upi_id', value: process.env.UPI_ID || 'YOUR_UPI_ID@upi' },
      { key: 'shop_name', value: process.env.SHOP_NAME || 'Blast Crackers Sivakasi' },
      { key: 'payment_instructions', value: 'Scan the dynamic QR code with any UPI app (GPay, PhonePe, Paytm, BHIM). After completing payment, click I Have Completed Payment and enter the 12-digit UPI UTR / Reference number.' },
      { key: 'require_utr', value: process.env.REQUIRE_UTR || 'true' },
      { key: 'payment_expiry_minutes', value: process.env.PAYMENT_EXPIRY_MINUTES || '15' },
      { key: 'low_stock_threshold', value: '20' }
    ];

    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
    `);

    for (const setting of defaultSettings) {
      insertSetting.run(setting.key, setting.value);
    }
  } catch (err) {
    console.warn('Default settings seed warning:', err.message);
  }

  // Seed default festive coupons if table is empty
  try {
    const couponCountRow = db.prepare('SELECT COUNT(*) as count FROM coupons').get();
    if (!couponCountRow || couponCountRow.count === 0) {
      const defaultCoupons = [
        {
          code: 'DIWALI2026',
          description: 'Special Diwali celebration flat ₹200 OFF on orders above ₹1,500',
          discount_type: 'flat',
          discount_value: 200,
          min_order_amount: 1500,
          max_discount_amount: 200,
          is_active: 1
        },
        {
          code: 'FESTIVE10',
          description: '10% OFF on all Sivakasi green crackers packages',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 500,
          max_discount_amount: 1000,
          is_active: 1
        },
        {
          code: 'FLASHSALE',
          description: '15% instant flash discount for early bird bookings',
          discount_type: 'percentage',
          discount_value: 15,
          min_order_amount: 1000,
          max_discount_amount: 1500,
          is_active: 1
        }
      ];

      const insertCoupon = db.prepare(`
        INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const cp of defaultCoupons) {
        insertCoupon.run(cp.code, cp.description, cp.discount_type, cp.discount_value, cp.min_order_amount, cp.max_discount_amount, cp.is_active);
      }
    }
  } catch (err) {
    console.warn('Default coupons seed warning:', err.message);
  }
}

// Helpers for settings management
function getSetting(key, defaultValue = null) {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function getAllSettings() {
  try {
    const rows = db.prepare('SELECT key, value, updated_at FROM settings').all();
    const result = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  } catch (err) {
    return {};
  }
}

function setSetting(key, value) {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(key, value);
}

// Order Timeline event logger
function addOrderTimelineEvent(orderId, status, title, description = '', createdBy = 'system') {
  try {
    const stmt = db.prepare(`
      INSERT INTO order_timeline (order_id, status, title, description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(orderId, status, title, description, createdBy);
  } catch (err) {
    console.error('Failed to log order timeline event:', err.message);
  }
}

function getOrderTimeline(orderId) {
  try {
    return db.prepare(`
      SELECT * FROM order_timeline 
      WHERE order_id = ? 
      ORDER BY created_at ASC, id ASC
    `).all(orderId);
  } catch (err) {
    return [];
  }
}

initSchema();

module.exports = db;
module.exports.getSetting = getSetting;
module.exports.getAllSettings = getAllSettings;
module.exports.setSetting = setSetting;
module.exports.addOrderTimelineEvent = addOrderTimelineEvent;
module.exports.getOrderTimeline = getOrderTimeline;
