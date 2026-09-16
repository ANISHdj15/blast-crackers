// test_production_hardening.js
// Automated verification suite for Production Hardening Phase

const http = require('http');
const db = require('./server/db/database');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running Production Hardening Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // ==========================================
    // 1. Security Headers Verification
    // ==========================================
    console.log('--- 1. Security Headers Audit ---');
    const health = await request('/api/health');
    assert(health.status === 200, 'Server /api/health responds 200 OK');
    assert(health.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff present');
    assert(health.headers['x-frame-options'] === 'SAMEORIGIN', 'X-Frame-Options: SAMEORIGIN present');
    assert(health.headers['x-xss-protection'] === '1; mode=block', 'X-XSS-Protection: 1; mode=block present');
    assert(health.headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Referrer-Policy present');
    assert(!!health.headers['permissions-policy'], 'Permissions-Policy present');

    // ==========================================
    // 2. Database Indexes & Foreign Keys
    // ==========================================
    console.log('\n--- 2. Database Index & Schema Integrity ---');
    const fkRow = db.prepare("PRAGMA foreign_keys").get();
    assert(fkRow.foreign_keys === 1, 'PRAGMA foreign_keys is strictly enabled (1)');

    const indexes = db.prepare("SELECT name, tbl_name FROM sqlite_master WHERE type = 'index'").all();
    const indexNames = indexes.map(i => i.name);
    
    assert(indexNames.includes('idx_order_items_order'), 'Index idx_order_items_order exists');
    assert(indexNames.includes('idx_orders_status'), 'Index idx_orders_status exists');
    assert(indexNames.includes('idx_orders_created'), 'Index idx_orders_created exists');
    assert(indexNames.includes('idx_products_slug'), 'Index idx_products_slug exists');
    assert(indexNames.includes('idx_categories_slug'), 'Index idx_categories_slug exists');
    assert(indexNames.includes('idx_orders_customer'), 'Index idx_orders_customer exists');

    // ==========================================
    // 3. Static SEO Directives (robots.txt & sitemap.xml)
    // ==========================================
    console.log('\n--- 3. SEO Static Assets ---');
    const robots = await request('/robots.txt');
    assert(robots.status === 200, 'robots.txt is accessible');
    assert(typeof robots.body === 'string' && robots.body.includes('Disallow: /api/admin/'), 'robots.txt blocks /api/admin/');
    assert(typeof robots.body === 'string' && robots.body.includes('Sitemap:'), 'robots.txt references sitemap');

    const sitemap = await request('/sitemap.xml');
    assert(sitemap.status === 200, 'sitemap.xml is accessible');
    assert(typeof sitemap.body === 'string' && sitemap.body.includes('https://blastcrackers.com/'), 'sitemap.xml includes root URL');
    assert(typeof sitemap.body === 'string' && sitemap.body.includes('sparklers'), 'sitemap.xml includes categories');

    // ==========================================
    // 4. Edge Cases: Empty Cart & Out-of-Stock
    // ==========================================
    console.log('\n--- 4. Edge Case Hardening: Empty Cart & Invalid Checkouts ---');
    
    // Test customer registration
    const uniqueEmail = `hardening_${Date.now()}@blastfireworks.in`;
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Hardening Tester',
        email: uniqueEmail,
        password: 'Password123!',
        phone: '9840123456'
      }
    });
    assert(regRes.status === 201 && regRes.body.success, 'Customer registers successfully');
    const customerToken = regRes.body.token;

    // Empty Cart Checkout Attempt
    const emptyCheckoutRes = await request('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        payment_method: 'UPI',
        address_data: {
          full_name: 'Hardening Tester',
          phone: '9840123456',
          house_building: 'Flat 1',
          street_area: 'Main Rd',
          city: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625020'
        }
      }
    });
    assert(emptyCheckoutRes.status === 400 && !emptyCheckoutRes.body.success, 'Empty cart checkout is safely rejected (400)');

    // Add item to cart
    const prod = db.prepare("SELECT * FROM products WHERE stock > 5 AND is_active = 1 LIMIT 1").get();
    const addCartRes = await request('/api/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        product_id: prod.id,
        quantity: 2
      }
    });
    assert(addCartRes.status === 200 && addCartRes.body.success, 'Item added to cart with verified stock');

    // ==========================================
    // 5. UPI Dynamic QR, Invalid UTR & Valid Submission
    // ==========================================
    console.log('\n--- 5. Dynamic UPI QR & Payment UTR Validation ---');
    const orderCreateRes = await request('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        payment_method: 'UPI',
        address_data: {
          full_name: 'Hardening Tester',
          phone: '9840123456',
          house_building: 'Flat 1',
          street_area: 'Main Rd',
          city: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625020'
        }
      }
    });
    assert(orderCreateRes.status === 201 && orderCreateRes.body.success, 'Order created successfully with UPI payment');
    const orderNum = orderCreateRes.body.order.order_number;
    const initialStock = db.prepare("SELECT stock FROM products WHERE id = ?").get(prod.id).stock;

    // Check dynamic UPI details
    const upiDetails = orderCreateRes.body.upi_details;
    assert(upiDetails && upiDetails.upi_id === 'YOUR_UPI_ID@upi', 'Payee UPI ID comes from secure config');
    assert(upiDetails.upi_uri.includes('pa=YOUR_UPI_ID%40upi') || upiDetails.upi_uri.includes('pa=YOUR_UPI_ID@upi'), 'UPI URI includes payee address');
    assert(upiDetails.upi_uri.includes(`am=${orderCreateRes.body.order.grand_total}`), 'UPI URI includes exact order amount');

    // Submit invalid UTR (too short / special characters)
    const invalidUtrRes = await request(`/api/orders/${orderNum}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        transaction_reference: '123'
      }
    });
    assert(invalidUtrRes.status === 400 && !invalidUtrRes.body.success, 'Short/invalid UTR is rejected with 400');

    // Submit valid 12-character UTR
    const validUtr = `UPI${Date.now().toString().slice(-9)}`;
    const validUtrRes = await request(`/api/orders/${orderNum}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        transaction_reference: validUtr
      }
    });
    assert(validUtrRes.status === 200 && validUtrRes.body.success, 'Valid 12-char UTR accepted, status updated to payment_verification');

    // ==========================================
    // 6. Customer Order Cancellation & Stock Restoration
    // ==========================================
    console.log('\n--- 6. Customer Order Cancellation & Stock Restoration ---');
    const cancelRes = await request(`/api/orders/${orderNum}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        reason: 'Testing cancellation and inventory rollback'
      }
    });
    assert(cancelRes.status === 200 && cancelRes.body.success, 'Customer self-cancels pending order successfully');

    const restoredStock = db.prepare("SELECT stock FROM products WHERE id = ?").get(prod.id).stock;
    assert(restoredStock === initialStock + 2, `Inventory correctly restored (+2 items: from ${initialStock} to ${restoredStock})`);

    const cancelledOrderRow = db.prepare("SELECT status FROM orders WHERE order_number = ?").get(orderNum);
    assert(cancelledOrderRow.status === 'cancelled', 'Order status verified as cancelled in database');

    // ==========================================
    // 7. Customer Data Isolation & Authorization
    // ==========================================
    console.log('\n--- 7. Cross-Customer Data Isolation ---');
    const attackerEmail = `attacker_${Date.now()}@blastfireworks.in`;
    const attackerReg = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Attacker User',
        email: attackerEmail,
        password: 'Password123!',
        phone: '9840999999'
      }
    });
    const attackerToken = attackerReg.body.token;

    // Attacker tries to cancel customer's order
    const breachCancelRes = await request(`/api/orders/${orderNum}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${attackerToken}`
      },
      body: { reason: 'Unauthorized cancel' }
    });
    assert(breachCancelRes.status === 403 || breachCancelRes.status === 404, 'Attacker cannot cancel other customer order (Forbidden / Not Found)');

    // Attacker tries to access admin metrics
    const breachAdminRes = await request('/api/admin/metrics', {
      headers: { 'Authorization': `Bearer ${attackerToken}` }
    });
    assert(breachAdminRes.status === 403, 'Regular customer strictly forbidden from /api/admin/metrics (403)');

    // ==========================================
    // Summary
    // ==========================================
    console.log(`\n==========================================`);
    console.log(`Hardening Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`==========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
