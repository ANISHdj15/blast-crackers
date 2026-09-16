const assert = require('assert');

async function runTests() {
  console.log('🧪 Starting automated E2E testing of Blast Crackers...');
  const baseUrl = 'http://localhost:5000';

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const health = await healthRes.json();
  assert.strictEqual(health.status, 'ok', 'Health check must be ok');
  console.log('✅ 1. Health check passed');

  // 2. Categories listing
  const catRes = await fetch(`${baseUrl}/api/categories`);
  const catData = await catRes.json();
  assert.strictEqual(catData.success, true);
  assert(catData.categories.length >= 10, 'Expected at least 10 categories');
  console.log(`✅ 2. Categories verified (${catData.categories.length} categories)`);

  // 3. Products listing & filtering
  const prodRes = await fetch(`${baseUrl}/api/products`);
  const prodData = await prodRes.json();
  assert.strictEqual(prodData.success, true);
  assert(prodData.products.length >= 25, 'Expected at least 25 products');
  console.log(`✅ 3. Products catalog verified (${prodData.products.length} products)`);

  // 3b. Search filter test
  const searchRes = await fetch(`${baseUrl}/api/products?search=1000%20Wala`);
  const searchData = await searchRes.json();
  assert(searchData.products.length >= 1, 'Search for 1000 Wala should return results');
  console.log('✅ 4. Product search verified');

  // 3c. Product detail
  const testProd = prodData.products[0];
  const detailRes = await fetch(`${baseUrl}/api/products/${testProd.id}`);
  const detailData = await detailRes.json();
  assert.strictEqual(detailData.success, true);
  assert(detailData.product.piece_count > 0);
  assert(detailData.product.sound_level !== undefined);
  console.log(`✅ 5. Product details & specifications verified for "${detailData.product.name}"`);

  // 4. Guest cart operations
  const sessionId = 'test_guest_session_' + Date.now();
  const guestHeaders = { 'Content-Type': 'application/json', 'x-session-id': sessionId };

  // Add item 1
  const addRes1 = await fetch(`${baseUrl}/api/cart/add`, {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ product_id: testProd.id, quantity: 2 })
  });
  const addData1 = await addRes1.json();
  assert.strictEqual(addData1.success, true);

  // Add item 2
  const item2 = prodData.products[1];
  await fetch(`${baseUrl}/api/cart/add`, {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ product_id: item2.id, quantity: 1 })
  });

  // Get cart
  const cartRes = await fetch(`${baseUrl}/api/cart`, { headers: guestHeaders });
  const cartData = await cartRes.json();
  assert.strictEqual(cartData.success, true);
  assert.strictEqual(cartData.items.length, 2, 'Cart should contain 2 distinct items');
  assert.strictEqual(cartData.total_items, 3, 'Total items count should be 3');
  console.log(`✅ 6. Guest cart verified (Items: ${cartData.items.length}, Subtotal: ₹${cartData.subtotal})`);

  // Update item quantity
  await fetch(`${baseUrl}/api/cart/update`, {
    method: 'PUT',
    headers: guestHeaders,
    body: JSON.stringify({ product_id: testProd.id, quantity: 4 })
  });
  const cartRes2 = await fetch(`${baseUrl}/api/cart`, { headers: guestHeaders });
  const cartData2 = await cartRes2.json();
  assert.strictEqual(cartData2.total_items, 5, 'Quantity should be updated to 5');
  console.log('✅ 7. Cart quantity update verified');

  // 5. Authentication (Customer Login)
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@gmail.com', password: 'Customer@123' })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginData.success, true);
  const customerToken = loginData.token;
  console.log(`✅ 8. Customer authentication verified (${loginData.user.name})`);

  // 6. Sync guest cart into logged-in customer cart
  const syncRes = await fetch(`${baseUrl}/api/cart/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ session_id: sessionId })
  });
  const syncData = await syncRes.json();
  if (!syncData.success) console.error('SYNC ERROR DETAILS:', syncData);
  assert.strictEqual(syncData.success, true);

  const authCartRes = await fetch(`${baseUrl}/api/cart`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const authCartData = await authCartRes.json();
  assert(authCartData.items.length >= 2, 'Customer cart should now contain synced items');
  console.log('✅ 9. Cart synchronization upon login verified');

  // 7. Customer Addresses
  const addrRes = await fetch(`${baseUrl}/api/addresses`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const addrData = await addrRes.json();
  assert.strictEqual(addrData.success, true);
  assert(addrData.addresses.length >= 1, 'Customer should have at least 1 saved address');
  const selectedAddr = addrData.addresses[0];
  console.log(`✅ 10. Saved address book verified (${selectedAddr.city}, ${selectedAddr.pincode})`);

  // 8. Order Placement with coupon & stock deduction
  const initialStock = testProd.stock;
  const orderRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      address_id: selectedAddr.id,
      payment_method: 'COD',
      coupon_code: 'DIWALI2026',
      notes: 'Festival parcel'
    })
  });
  const orderData = await orderRes.json();
  assert.strictEqual(orderData.success, true);
  assert(orderData.order.order_number.startsWith('BLAST-2026-'), 'Order number format check');
  console.log(`✅ 11. Order creation & stock deduction verified (Order: ${orderData.order.order_number})`);

  // Verify stock decremented
  const updatedProdRes = await fetch(`${baseUrl}/api/products/${testProd.id}`);
  const updatedProdData = await updatedProdRes.json();
  assert(updatedProdData.product.stock < initialStock, 'Stock must decrease after order placement');
  console.log(`✅ 12. Database stock decrement verified (${initialStock} -> ${updatedProdData.product.stock})`);

  // 9. Order Tracking
  const trackRes = await fetch(`${baseUrl}/api/orders/track/${orderData.order.order_number}`);
  const trackData = await trackRes.json();
  assert.strictEqual(trackData.success, true);
  assert.strictEqual(trackData.order.order_number, orderData.order.order_number);
  assert(trackData.timeline.length >= 5, 'Timeline must have at least 5 stages');
  console.log(`✅ 13. Order tracking timeline verified (${trackData.timeline.length} stages)`);

  // 10. Admin Console Authentication & Metrics
  const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@blastcrackers.com', password: 'Admin@123' })
  });
  const adminLogin = await adminLoginRes.json();
  assert.strictEqual(adminLogin.user.role, 'admin');
  const adminToken = adminLogin.token;

  const adminStatsRes = await fetch(`${baseUrl}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminStats = await adminStatsRes.json();
  assert.strictEqual(adminStats.success, true);
  assert(adminStats.stats.total_revenue > 0, 'Total revenue should reflect orders');
  assert(adminStats.stats.total_orders >= 1, 'Total orders should be recorded');
  console.log(`✅ 14. Admin KPIs verified (Revenue: ₹${adminStats.stats.total_revenue}, Orders: ${adminStats.stats.total_orders})`);

  // 11. Admin updates order status
  const updateStatusRes = await fetch(`${baseUrl}/api/admin/orders/${orderData.order.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'dispatched', tracking_number: 'TRK-TEST-SIVAKASI-88' })
  });
  const updateStatusData = await updateStatusRes.json();
  assert.strictEqual(updateStatusData.success, true);

  // Check updated status in tracking
  const trackUpdatedRes = await fetch(`${baseUrl}/api/orders/track/${orderData.order.order_number}`);
  const trackUpdatedData = await trackUpdatedRes.json();
  assert.strictEqual(trackUpdatedData.order.status, 'dispatched');
  assert.strictEqual(trackUpdatedData.timeline[2].completed, true);
  console.log('✅ 15. Admin order status advancement verified (Confirmed -> Dispatched)');

  console.log('\n🎉 ALL 15 END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY! 🎆');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
