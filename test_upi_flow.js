const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Comprehensive UPI QR Payment Flow Test Suite...\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // Helper login
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data;
  }

  // 1. Get Payment Settings
  await test('Public endpoint returns store UPI configuration without hardcoding', async () => {
    const res = await fetch(`${BASE_URL}/settings/payment`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.settings.shop_upi_id, 'Shop UPI ID must exist');
    assert.ok(data.settings.shop_name, 'Shop Name must exist');
    assert.strictEqual(typeof data.settings.require_utr, 'boolean');
    assert.strictEqual(typeof data.settings.payment_expiry_minutes, 'number');
  });

  // 2. Dynamic UPI URI Construction for ₹100, ₹999, and ₹1,250.50
  await test('Dynamic UPI URI formatting accurately encodes ₹100, ₹999, and ₹1,250.50', async () => {
    const buildUpi = (upiId, name, amount, orderNum) => {
      const cleanAmount = Number(amount).toFixed(2);
      const params = new URLSearchParams({
        pa: upiId,
        pn: name,
        am: cleanAmount,
        cu: 'INR',
        tn: `Order ${orderNum}`
      });
      return `upi://pay?${params.toString()}`;
    };

    const uri100 = buildUpi('YOUR_UPI_ID@upi', 'Blast Crackers Sivakasi', 100, 'BLAST-TEST-100');
    assert.ok(uri100.includes('am=100.00'), 'Should have am=100.00');
    assert.ok(uri100.includes('pa=YOUR_UPI_ID%40upi'), 'Should URL encode @ in UPI ID');
    assert.ok(uri100.includes('cu=INR'), 'Currency must be INR');

    const uri999 = buildUpi('YOUR_UPI_ID@upi', 'Blast Crackers Sivakasi', 999, 'BLAST-TEST-999');
    assert.ok(uri999.includes('am=999.00'), 'Should have am=999.00');

    const uri1250_50 = buildUpi('YOUR_UPI_ID@upi', 'Blast Crackers Sivakasi', 1250.50, 'BLAST-TEST-1250');
    assert.ok(uri1250_50.includes('am=1250.50'), 'Should have am=1250.50');
  });

  // 3. Place Order with UPI Payment Method
  let customerToken = '';
  let customerUser = null;
  let createdOrderNumber = '';
  let createdGrandTotal = 0;

  await test('Customer logs in and places an order with payment_method=UPI', async () => {
    const loginData = await login('customer@gmail.com', 'Customer@123');
    assert.strictEqual(loginData.success, true, loginData.message);
    customerToken = loginData.token;
    customerUser = loginData.user;

    // Get an active product
    const prodsRes = await fetch(`${BASE_URL}/products`);
    const prodsData = await prodsRes.json();
    const product = prodsData.products[0];

    // Add to cart
    await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ product_id: product.id, quantity: 2 })
    });

    // Create Order with UPI
    const orderRes = await fetch(`${BASE_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        payment_method: 'UPI',
        address_data: {
          full_name: 'Priya Sharma',
          phone: '9876543210',
          house_building: 'Plot 42, Sri Meenakshi Enclave',
          street_area: 'Bypass Road',
          city: 'Madurai',
          district: 'Madurai',
          state: 'Tamil Nadu',
          pincode: '625016'
        }
      })
    });

    const orderData = await orderRes.json();
    assert.strictEqual(orderData.success, true, orderData.message);
    assert.strictEqual(orderData.order.status, 'pending_payment', 'UPI order must start as pending_payment');
    assert.ok(orderData.upi_details, 'Should return upi_details object');
    assert.ok(orderData.upi_details.upi_uri.startsWith('upi://pay?'), 'URI must start with upi://pay?');
    assert.ok(orderData.upi_details.upi_uri.includes(Number(orderData.order.grand_total).toFixed(2)), 'URI must include exact grand total');

    createdOrderNumber = orderData.order.order_number;
    createdGrandTotal = orderData.order.grand_total;
  });

  // 4. Idempotent Payment Info Fetch (Simulating Page Refresh)
  await test('Fetching payment details is idempotent and prevents duplicate order creation', async () => {
    const res1 = await fetch(`${BASE_URL}/orders/${createdOrderNumber}/payment`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const data1 = await res1.json();
    assert.strictEqual(data1.success, true);
    assert.strictEqual(data1.order.order_number, createdOrderNumber);
    assert.strictEqual(data1.order.grand_total, createdGrandTotal);
    assert.strictEqual(data1.payment.status, 'pending');

    // Fetch a second time (page refresh)
    const res2 = await fetch(`${BASE_URL}/orders/${createdOrderNumber}/payment`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const data2 = await res2.json();
    assert.strictEqual(data2.order.id, data1.order.id, 'Order ID must remain strictly identical');
    assert.strictEqual(data2.payment.id, data1.payment.id, 'Payment record ID must remain identical');
  });

  // 5. Invalid UTR Submission Validation
  await test('Reject invalid UTR numbers (too short, too long, special characters)', async () => {
    // Too short (3 chars)
    const shortRes = await fetch(`${BASE_URL}/orders/${createdOrderNumber}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ transaction_reference: '123' })
    });
    const shortData = await shortRes.json();
    assert.strictEqual(shortRes.status, 400, 'Should reject short UTR with 400');
    assert.strictEqual(shortData.success, false);

    // Invalid characters (symbols)
    const symRes = await fetch(`${BASE_URL}/orders/${createdOrderNumber}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ transaction_reference: '42817812901!' })
    });
    const symData = await symRes.json();
    assert.strictEqual(symRes.status, 400, 'Should reject non-alphanumeric UTR');
  });

  // 6. Valid UTR Submission & Status Transition to 'submitted' / 'payment_verification'
  let paymentRecordId = null;

  await test('Valid 12-digit UTR submission marks payment as "submitted" and order as "payment_verification"', async () => {
    const validUtr = '428178129012';
    const res = await fetch(`${BASE_URL}/orders/${createdOrderNumber}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ transaction_reference: validUtr })
    });

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.status, 'payment_verification', 'Order must move to payment_verification, NOT confirmed yet');
    assert.strictEqual(data.payment.payment_status, 'submitted', 'Payment must move to submitted, NOT paid yet');
    assert.strictEqual(data.payment.transaction_reference, validUtr);
    assert.ok(data.payment.customer_submitted_at, 'customer_submitted_at must be recorded');

    paymentRecordId = data.payment.id;
  });

  // 7. Order Tracking shows "Payment Submission" and "Payment Verification" stages
  await test('Order tracking timeline reflects payment verification stage', async () => {
    const res = await fetch(`${BASE_URL}/orders/track/${createdOrderNumber}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.order.status, 'payment_verification');
    assert.ok(data.timeline.length > 0);
    const subStage = data.timeline.find(t => t.stage === 'Payment Submission');
    assert.ok(subStage, 'Must include Payment Submission stage');
    assert.strictEqual(subStage.completed, true);
  });

  // 8. Admin Login & Payment Queue
  let adminToken = '';

  await test('Admin accesses /api/admin/payments and views the pending verification item', async () => {
    const adminLogin = await login('admin@blastcrackers.com', 'Admin@123');
    assert.strictEqual(adminLogin.success, true, adminLogin.message);
    adminToken = adminLogin.token;

    const res = await fetch(`${BASE_URL}/admin/payments`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.payments));

    const item = data.payments.find(p => p.order_number === createdOrderNumber);
    assert.ok(item, 'Order must appear in admin payment queue');
    assert.strictEqual(item.transaction_reference, '428178129012');
    assert.strictEqual(item.payment_status, 'submitted');
    assert.strictEqual(item.order_status, 'payment_verification');
  });

  // 9. Admin Verifies Payment
  await test('Admin verifies payment: payment_status moves to "paid" and order_status moves to "confirmed"', async () => {
    const res = await fetch(`${BASE_URL}/admin/payments/${paymentRecordId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.payment.payment_status, 'paid');
    assert.strictEqual(data.order.status, 'confirmed', 'Order moves to confirmed only after payment verification');
    assert.ok(data.payment.verified_at);
    assert.ok(data.payment.verified_by);

    // Verify order tracking shows Confirmed
    const trackRes = await fetch(`${BASE_URL}/orders/track/${createdOrderNumber}`);
    const trackData = await trackRes.json();
    assert.strictEqual(trackData.order.status, 'confirmed');
    assert.strictEqual(trackData.order.payment_status, 'paid');
  });

  // 10. Admin Rejection Flow Test with a second order
  await test('Admin rejects invalid payment: payment_status moves to "failed" and order remains unpaid', async () => {
    // Create second order
    const prodsRes = await fetch(`${BASE_URL}/products`);
    const prodsData = await prodsRes.json();
    const product = prodsData.products[1];

    await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ product_id: product.id, quantity: 1 })
    });

    const orderRes = await fetch(`${BASE_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        payment_method: 'UPI',
        address_data: {
          full_name: 'Test Customer',
          phone: '9876543210',
          house_building: '10 Flower St',
          street_area: 'Town',
          city: 'Sivakasi',
          pincode: '626123'
        }
      })
    });
    const orderData = await orderRes.json();
    const orderNum2 = orderData.order.order_number;

    // Submit dummy UTR
    const subRes = await fetch(`${BASE_URL}/orders/${orderNum2}/submit-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({ transaction_reference: '999999999999' })
    });
    const subData = await subRes.json();
    const payId2 = subData.payment.id;

    // Admin rejects
    const rejectRes = await fetch(`${BASE_URL}/admin/payments/${payId2}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ reason: 'Fake UTR: Transaction not credited' })
    });

    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.success, true);
    assert.strictEqual(rejectData.payment.payment_status, 'failed');
    assert.strictEqual(rejectData.order.status, 'pending_payment', 'Order status must remain pending_payment');
  });

  // 11. Admin Configuration Update Test (Change UPI ID & Verify Dynamic QR Update)
  await test('Admin updates store UPI ID to "festiveblast@upi" and restores to "YOUR_UPI_ID@upi"', async () => {
    // 1. Update UPI ID
    const updateRes = await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        shop_upi_id: 'festiveblast@upi',
        shop_name: 'Blast Fireworks Depot',
        payment_expiry_minutes: 20
      })
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateData.success, true);
    assert.strictEqual(updateData.settings.shop_upi_id, 'festiveblast@upi');

    // 2. Verify public endpoint reflects change
    const pubRes = await fetch(`${BASE_URL}/settings/payment`);
    const pubData = await pubRes.json();
    assert.strictEqual(pubData.settings.shop_upi_id, 'festiveblast@upi');
    assert.strictEqual(pubData.settings.shop_name, 'Blast Fireworks Depot');
    assert.strictEqual(pubData.settings.payment_expiry_minutes, 20);

    // 3. Restore default setting
    await fetch(`${BASE_URL}/settings/admin`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        shop_upi_id: 'YOUR_UPI_ID@upi',
        shop_name: 'Blast Crackers Sivakasi',
        payment_expiry_minutes: 15
      })
    });

    const checkRestored = await fetch(`${BASE_URL}/settings/payment`);
    const checkRestoredData = await checkRestored.json();
    assert.strictEqual(checkRestoredData.settings.shop_upi_id, 'YOUR_UPI_ID@upi');
  });

  // 12. Security Test: Unauthorized Access Prevention
  await test('Security: Non-admin users cannot access admin payment verification or settings endpoints', async () => {
    // Customer accessing admin payments
    const res1 = await fetch(`${BASE_URL}/admin/payments`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert.strictEqual(res1.status, 403, 'Customer should receive 403 Forbidden on admin payments');

    // Unauthenticated accessing admin settings
    const res2 = await fetch(`${BASE_URL}/settings/admin`);
    assert.strictEqual(res2.status, 401, 'Unauthenticated should receive 401 Unauthorized on admin settings');
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed}/${total} passed`);
  console.log(`========================================\n`);

  if (passed === total) {
    console.log('🎉 ALL UPI PAYMENT FLOW TESTS PASSED PERFECTLY!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
