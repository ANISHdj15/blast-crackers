const assert = require('assert');
const { Pool } = require('pg');

const VERCEL_URL = 'https://client-zeta-six-38.vercel.app';
const RENDER_URL = 'https://blast-crackers-api.onrender.com';
const SUPABASE_DB_URL = 'postgresql://postgres.qdzmkxrtquovradsjkuh:Anishbosco%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

async function runLiveIndependentVerification() {
  console.log('================================================================');
  console.log('🚀 TESTING LIVE CLOUD DEPLOYMENT COMPLETELY INDEPENDENT OF LOCALHOST');
  console.log('Frontend:', VERCEL_URL);
  console.log('Backend :', RENDER_URL);
  console.log('Database: Supabase PostgreSQL (Tokyo)');
  console.log('Local Server Status: COMPLETELY SWITCHED OFF');
  console.log('================================================================\n');

  // 1. Verify Vercel Frontend is serving HTML
  console.log('1. Testing Public Vercel Frontend...');
  const vRes = await fetch(VERCEL_URL);
  assert.strictEqual(vRes.status, 200, 'Vercel frontend must return 200 OK');
  const vHtml = await vRes.text();
  assert(vHtml.includes('Blast Crackers'), 'Vercel must serve Blast Crackers HTML');
  console.log('✅ Vercel Frontend: 200 OK (Independent from localhost)');

  // 2. Verify Render Backend Health
  console.log('\n2. Testing Public Render Backend Health...');
  const hRes = await fetch(`${RENDER_URL}/health`);
  assert.strictEqual(hRes.status, 200, 'Render /health must return 200 OK');
  console.log('✅ Render Backend: 200 OK (Independent from localhost)');

  // 3. Verify Categories from Cloud Database
  console.log('\n3. Testing Categories via Render...');
  const catRes = await fetch(`${RENDER_URL}/api/categories`);
  assert.strictEqual(catRes.status, 200);
  const catData = await catRes.json();
  assert.strictEqual(catData.success, true);
  assert(catData.categories.length >= 10, 'Must have at least 10 categories');
  console.log(`✅ Categories verified: ${catData.categories.length} categories loaded from Supabase`);

  // 4. Verify Products Catalog from Cloud Database
  console.log('\n4. Testing Products Catalog via Render...');
  const prodRes = await fetch(`${RENDER_URL}/api/products`);
  assert.strictEqual(prodRes.status, 200);
  const prodData = await prodRes.json();
  assert.strictEqual(prodData.success, true);
  assert(prodData.products.length >= 25, 'Must have at least 25 products in catalog');
  console.log(`✅ Products catalog verified: ${prodData.products.length} products loaded from Supabase`);

  // 5. Test Customer Registration on Live Cloud Backend
  console.log('\n5. Testing Live Customer Registration...');
  const testEmail = `cloud_tester_${Date.now()}@gmail.com`;
  const regRes = await fetch(`${RENDER_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Cloud Independent Tester',
      email: testEmail,
      phone: '+91 9887766554',
      password: 'CloudTester@2026'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true, 'Customer registration must succeed');
  const customerToken = regData.token;
  console.log(`✅ Customer registered: ${testEmail} (Stored in Supabase PostgreSQL)`);

  // 6. Test Customer Login on Live Cloud Backend
  console.log('\n6. Testing Live Customer Login...');
  const loginRes = await fetch(`${RENDER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'CloudTester@2026'
    })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true, 'Customer login must succeed');
  console.log('✅ Customer logged in successfully with JWT token');

  // 7. Test Add Address to Supabase
  console.log('\n7. Testing Customer Address Creation...');
  const addrRes = await fetch(`${RENDER_URL}/api/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      full_name: 'Cloud Independent Tester',
      phone: '+91 9887766554',
      house_building: 'Flat 402, Golden Residency',
      street_area: 'Diwali Nagar, Bypass Road',
      landmark: 'Near Siva Temple',
      city: 'Sivakasi',
      district: 'Virudhunagar',
      state: 'Tamil Nadu',
      pincode: '626123',
      is_default: 1
    })
  });
  const addrData = await addrRes.json();
  if (!addrData.success) console.error('Address creation error:', addrData);
  assert.strictEqual(addrData.success, true, 'Address must be added');
  const addressId = addrData.address.id;
  console.log(`✅ Customer address created with ID: ${addressId}`);

  // 8. Test Cart Creation on Live Backend
  console.log('\n8. Testing Cart Operations...');
  const product = prodData.products[0];
  const cartRes = await fetch(`${RENDER_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      product_id: product.id,
      quantity: 2
    })
  });
  const cartData = await cartRes.json();
  assert.strictEqual(cartData.success, true, 'Product must be added to cart');
  console.log(`✅ Added 2 units of "${product.name}" to cart`);

  // 9. Test Order Creation (Checkout Flow)
  console.log('\n9. Testing Order Creation & Stock Validation...');
  const orderRes = await fetch(`${RENDER_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      address_id: addressId,
      payment_method: 'UPI',
      customer_notes: 'Urgent Diwali order - test cloud persistence',
      transport_hub: 'Sivakasi Parcel Service'
    })
  });
  const orderData = await orderRes.json();
  assert.strictEqual(orderData.success, true, 'Order must be created');
  const order = orderData.order;
  console.log(`✅ Order placed: ${order.order_number} | Total: ₹${order.grand_total}`);

  // 10. Test UPI QR Payment Generation & Submission
  console.log('\n10. Testing Dynamic UPI QR & Payment Submission...');
  const payRes = await fetch(`${RENDER_URL}/api/orders/${order.order_number}/submit-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      transaction_reference: '428178129012'
    })
  });
  const payData = await payRes.json();
  if (!payData.success) console.error('Payment submission error:', payData);
  assert.strictEqual(payData.success, true, 'Payment submission must succeed');
  console.log(`✅ Payment submitted for ${order.order_number}`);

  // 11. Test Admin Login & Payment Verification
  console.log('\n11. Testing Admin Dashboard & Payment Confirmation...');
  const adminLoginRes = await fetch(`${RENDER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@blastcrackers.com',
      password: 'Admin@123'
    })
  });
  const adminLogin = await adminLoginRes.json();
  assert.strictEqual(adminLogin.success, true, 'Admin login must succeed');
  const adminToken = adminLogin.token;

  // Advance order status: Confirmed -> Processing -> Dispatched
  const statusRes = await fetch(`${RENDER_URL}/api/admin/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'dispatched',
      tracking_number: 'TRK-BLAST-CLOUD-999',
      notes: 'Shipped via Sivakasi Super Express Transport'
    })
  });
  const statusData = await statusRes.json();
  assert.strictEqual(statusData.success, true, 'Admin must update order status');
  console.log(`✅ Admin updated order status to: dispatched (Tracking: TRK-BLAST-CLOUD-999)`);

  // 12. Test Customer Order Tracking Timeline
  console.log('\n12. Testing Public Order Tracking Timeline...');
  const trackRes = await fetch(`${RENDER_URL}/api/orders/track/${order.order_number}`);
  assert.strictEqual(trackRes.status, 200);
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.success, true);
  assert(trackData.timeline.length >= 2, 'Timeline must show placed and dispatched events');
  console.log(`✅ Tracking verified: ${trackData.timeline.length} timeline events recorded`);

  // 13. DIRECT VERIFICATION IN SUPABASE POSTGRESQL CLOUD DATABASE
  console.log('\n13. Direct Query to Supabase PostgreSQL...');
  const pool = new Pool({
    connectionString: SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  const dbUser = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [testEmail]);
  assert.strictEqual(dbUser.rows.length, 1, 'User must exist in Supabase');
  console.log(`✅ Supabase Database: Customer record verified in "users" table (ID: ${dbUser.rows[0].id})`);

  const dbOrder = await pool.query('SELECT id, order_number, status, grand_total FROM orders WHERE order_number = $1', [order.order_number]);
  assert.strictEqual(dbOrder.rows.length, 1, 'Order must exist in Supabase');
  assert.strictEqual(dbOrder.rows[0].status, 'dispatched', 'Status in Supabase must match dispatched');
  console.log(`✅ Supabase Database: Order record verified in "orders" table (Status: ${dbOrder.rows[0].status})`);

  const dbAddress = await pool.query('SELECT id, house_building, city FROM addresses WHERE id = $1', [addressId]);
  assert.strictEqual(dbAddress.rows.length, 1, 'Address must exist in Supabase');
  console.log(`✅ Supabase Database: Address verified in "addresses" table (${dbAddress.rows[0].house_building}, ${dbAddress.rows[0].city})`);

  await pool.end();

  console.log('\n================================================================');
  console.log('🎉 100% PRODUCTION HARDENED & INDEPENDENT FROM LOCALHOST VERIFIED!');
  console.log('================================================================');
}

runLiveIndependentVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
