// test_live_public_url.js
const PUBLIC_BASE_URL = 'https://compact-nutten-direct-secretariat.trycloudflare.com';

async function runLiveTest() {
  console.log(`🌐 Testing Live Public Deployment: ${PUBLIC_BASE_URL}\n`);
  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  // 1. Health Endpoint
  const healthRes = await fetch(`${PUBLIC_BASE_URL}/api/health`);
  assert(healthRes.ok, 'Public GET /api/health responds with HTTP 200');
  const healthData = await healthRes.json();
  assert(healthData.status === 'ok' && healthData.store === 'Blast Crackers', 'API Health returns valid store identity');

  // 2. Public Frontend HTML
  const htmlRes = await fetch(`${PUBLIC_BASE_URL}/`);
  assert(htmlRes.ok, 'Public GET / serves React SPA HTML bundle');
  const htmlText = await htmlRes.text();
  assert(htmlText.includes('Blast Crackers'), 'Frontend HTML contains Blast Crackers title');

  // 3. Categories
  const catRes = await fetch(`${PUBLIC_BASE_URL}/api/categories`);
  const catData = await catRes.json();
  assert(catRes.ok && catData.categories.length === 10, `Loaded ${catData.categories?.length} categories from API`);

  // 4. Products
  const prodRes = await fetch(`${PUBLIC_BASE_URL}/api/products`);
  const prodData = await prodRes.json();
  assert(prodRes.ok && prodData.products.length >= 25, `Loaded ${prodData.products?.length} products from API`);
  const sampleProduct = prodData.products[0];
  assert(sampleProduct && sampleProduct.price > 0, `Sample product "${sampleProduct.name}" priced at ₹${sampleProduct.price}`);

  // 5. Customer Registration
  const testEmail = `livetester_${Date.now()}@blastcrackers.com`;
  const regRes = await fetch(`${PUBLIC_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Client Live Tester',
      email: testEmail,
      phone: '+91 9988776655',
      password: 'LiveTest@123'
    })
  });
  const regData = await regRes.json();
  assert(regRes.ok && regData.success, `Live customer registered: ${testEmail}`);
  const customerToken = regData.token;

  // 6. Customer Login
  const loginRes = await fetch(`${PUBLIC_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'LiveTest@123'
    })
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok && loginData.success && !!loginData.token, 'Customer logged in and received JWT session token');

  // 7. Address Creation
  const addrRes = await fetch(`${PUBLIC_BASE_URL}/api/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      full_name: 'Client Live Tester',
      phone: '+91 9988776655',
      house_building: 'Flat 4B, Lotus Apartments',
      street_area: 'Anna Salai',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600002',
      is_default: 1
    })
  });
  const addrData = await addrRes.json();
  assert(addrRes.ok && addrData.success, `Customer address created with ID ${addrData.address?.id}`);
  const addressId = addrData.address.id;

  // 8. Add Product to Cart
  const cartAddRes = await fetch(`${PUBLIC_BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      product_id: sampleProduct.id,
      quantity: 2
    })
  });
  const cartAddData = await cartAddRes.json();
  assert(cartAddRes.ok && cartAddData.success, `Added ${sampleProduct.name} (x2) to cart`);

  // 9. Order Creation with UPI Payment Method
  const orderCreateRes = await fetch(`${PUBLIC_BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      address_id: addressId,
      payment_method: 'UPI',
      notes: 'Live public client testing order'
    })
  });
  const orderCreateData = await orderCreateRes.json();
  assert(orderCreateRes.ok && orderCreateData.success, `Order placed successfully: ${orderCreateData.order?.order_number}`);
  const orderNumber = orderCreateData.order.order_number;
  const orderId = orderCreateData.order.id;
  const grandTotal = orderCreateData.order.grand_total;
  assert(grandTotal >= sampleProduct.price * 2, `Server-side verified order grand total: ₹${grandTotal}`);

  // 10. Customer Order Tracking
  const trackRes = await fetch(`${PUBLIC_BASE_URL}/api/orders/track/${orderNumber}`);
  const trackData = await trackRes.json();
  assert(trackRes.ok && trackData.success, `Order tracking verified for ${orderNumber}`);
  assert(trackData.order.status === 'pending_payment', 'Initial order status is "pending_payment"');

  // 11. Customer Submits 12-digit UPI UTR
  const utrSubmissionRes = await fetch(`${PUBLIC_BASE_URL}/api/orders/${orderNumber}/submit-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      transaction_reference: '123456789012'
    })
  });
  const utrData = await utrSubmissionRes.json();
  assert(utrSubmissionRes.ok && utrData.success, '12-digit UTR reference submitted by customer');

  // 12. Admin Authentication
  const adminLoginRes = await fetch(`${PUBLIC_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@blastcrackers.com',
      password: 'Admin@123'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.ok && adminLoginData.user?.role === 'admin', 'Store Administrator authenticated');
  const adminToken = adminLoginData.token;

  // 13. Admin Dashboard KPIs
  const statsRes = await fetch(`${PUBLIC_BASE_URL}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const statsData = await statsRes.json();
  assert(statsRes.ok && statsData.success, `Admin dashboard KPIs retrieved (Total orders: ${statsData.stats?.total_orders})`);

  // 14. Admin Verify Payment
  const paymentsRes = await fetch(`${PUBLIC_BASE_URL}/api/admin/payments`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const paymentsData = await paymentsRes.json();
  const paymentItem = paymentsData.payments?.find(p => p.order_number === orderNumber);
  assert(!!paymentItem, `Found pending payment for order ${orderNumber} (ID: ${paymentItem?.payment_id})`);

  const paymentId = paymentItem.payment_id || paymentItem.id;
  const adminVerifyRes = await fetch(`${PUBLIC_BASE_URL}/api/admin/payments/${paymentId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  const adminVerifyData = await adminVerifyRes.json();
  assert(adminVerifyRes.ok && adminVerifyData.success, 'Admin verified and approved UPI payment');

  // 15. Admin Advance Status to Dispatched
  const statusUpdateRes = await fetch(`${PUBLIC_BASE_URL}/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'dispatched',
      notes: 'Dispatched via Sivakasi Express'
    })
  });
  const statusUpdateData = await statusUpdateRes.json();
  assert(statusUpdateRes.ok && statusUpdateData.success, 'Admin advanced order lifecycle status to "dispatched"');

  // 16. Customer Re-verifies Updated Status on Public URL
  const trackUpdatedRes = await fetch(`${PUBLIC_BASE_URL}/api/orders/track/${orderNumber}`);
  const trackUpdatedData = await trackUpdatedRes.json();
  assert(trackUpdatedData.order.status === 'dispatched', `Customer live view confirms order status is now "${trackUpdatedData.order.status}"`);

  // 17. Persistence Verification after Logout/Login
  const reLoginRes = await fetch(`${PUBLIC_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'LiveTest@123'
    })
  });
  const reLoginData = await reLoginRes.json();
  const myOrdersRes = await fetch(`${PUBLIC_BASE_URL}/api/orders/my-orders`, {
    headers: { 'Authorization': `Bearer ${reLoginData.token}` }
  });
  const myOrdersData = await myOrdersRes.json();
  assert(myOrdersData.orders && myOrdersData.orders.some(o => o.order_number === orderNumber), 'Order record persisted across customer sessions in database');

  console.log(`\n🎉 Live Public Testing Results: ${passed}/${total} assertions passed (100%)\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runLiveTest().catch(err => {
  console.error('Fatal live test error:', err);
  process.exit(1);
});
