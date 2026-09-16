// test_admin_and_tracking.js
// Verification suite for Admin Dashboard & Customer Order Tracking System

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING ADMIN DASHBOARD & ORDER TRACKING TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Authenticate Customer and Admin
  console.log('1. Authentication Verification:');
  const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@gmail.com', password: 'Customer@123' })
  });
  const custData = await custLoginRes.json();
  assert(custData.success && custData.token, 'Customer login succeeded');
  const custToken = custData.token;

  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@blastcrackers.com', password: 'Admin@123' })
  });
  const adminData = await adminLoginRes.json();
  assert(adminData.success && adminData.token && adminData.user.role === 'admin', 'Admin login succeeded with admin role');
  const adminToken = adminData.token;

  // 2. Test Admin Stats with 100% Real SQL Aggregates
  console.log('\n2. Admin Dashboard KPIs & Real Analytics:');
  const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const statsJson = await statsRes.json();
  assert(statsJson.success === true, 'Admin stats endpoint returned success');
  const s = statsJson.stats;
  assert(typeof s.total_orders === 'number', `KPI Total Orders: ${s.total_orders}`);
  assert(typeof s.pending_orders === 'number', `KPI Pending Orders: ${s.pending_orders}`);
  assert(typeof s.confirmed_orders === 'number', `KPI Confirmed Orders: ${s.confirmed_orders}`);
  assert(typeof s.processing_orders === 'number', `KPI Processing Orders: ${s.processing_orders}`);
  assert(typeof s.delivered_orders === 'number', `KPI Delivered Orders: ${s.delivered_orders}`);
  assert(typeof s.cancelled_orders === 'number', `KPI Cancelled Orders: ${s.cancelled_orders}`);
  assert(typeof s.pending_payments === 'number', `KPI Pending Payments: ${s.pending_payments}`);
  assert(typeof s.total_sales === 'number', `KPI Total Sales: ₹${s.total_sales}`);
  assert(Array.isArray(s.sales_over_time), `Real Sales Over Time Chart Data: ${s.sales_over_time.length} points`);
  assert(Array.isArray(s.top_products), `Real Top Products Data: ${s.top_products.length} items`);
  assert(Array.isArray(s.category_sales), `Real Category Sales Breakdown: ${s.category_sales.length} categories`);

  // 3. Create a Test Order to Verify Timeline and Tracking
  console.log('\n3. Order Creation & Database Timeline Initialization:');
  // Add item to cart
  const prodsRes = await fetch(`${BASE_URL}/api/products`);
  const prodsJson = await prodsRes.json();
  const testProduct = prodsJson.products[0];
  const initialStock = testProduct.stock;

  await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({ product_id: testProduct.id, quantity: 2 })
  });

  const orderRes = await fetch(`${BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      payment_method: 'UPI',
      address_data: {
        full_name: 'Anish Bosco',
        phone: '9876543210',
        house_building: '102 Fireworks Avenue',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001'
      }
    })
  });
  const orderJson = await orderRes.json();
  assert(orderJson.success === true, `Order created: ${orderJson.order_number}`);
  const createdOrderNum = orderJson.order_number;
  const createdOrderId = orderJson.order.id;

  // Verify stock decremented
  const checkProdRes = await fetch(`${BASE_URL}/api/products/${testProduct.id}`);
  const checkProdJson = await checkProdRes.json();
  assert(checkProdJson.product.stock === initialStock - 2, `Stock decremented from ${initialStock} to ${checkProdJson.product.stock}`);

  // 4. Test Customer Tracking Endpoint
  console.log('\n4. Customer Tracking with Timeline Events:');
  const trackRes = await fetch(`${BASE_URL}/api/orders/track/${createdOrderNum}`);
  const trackJson = await trackRes.json();
  assert(trackJson.success === true, 'Order tracking endpoint returned success');
  assert(Array.isArray(trackJson.timeline), 'Visual timeline stages array present');
  assert(Array.isArray(trackJson.events) && trackJson.events.length >= 1, `Order timeline events logged in database: ${trackJson.events.length} event(s)`);
  assert(trackJson.events[0].status === 'pending_payment', `Initial timeline event status: "${trackJson.events[0].status}"`);

  // 5. Test Customer Order Detail Endpoint
  console.log('\n5. Customer Order Detail Endpoint:');
  const detailRes = await fetch(`${BASE_URL}/api/orders/${createdOrderNum}/detail`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const detailJson = await detailRes.json();
  assert(detailJson.success === true, 'Order detail endpoint returned success');
  assert(detailJson.order.order_number === createdOrderNum, 'Order number matches');
  assert(detailJson.order.items.length > 0, 'Items breakdown returned');
  assert(detailJson.order.parsed_address.city === 'Chennai', 'Address snapshot parsed correctly');
  assert(Array.isArray(detailJson.order.timeline), 'Order timeline included');

  // 6. Test Customer UPI Payment Submission
  console.log('\n6. Customer Payment Submission & Timeline Update:');
  const submitPayRes = await fetch(`${BASE_URL}/api/orders/${createdOrderNum}/submit-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({ transaction_reference: '987654321098' })
  });
  const submitPayJson = await submitPayRes.json();
  assert(submitPayJson.success === true, 'Payment submission succeeded');
  assert(submitPayJson.order.status === 'payment_verification', 'Order status moved to payment_verification');

  // Verify timeline logged payment submission
  const trackAfterPay = await (await fetch(`${BASE_URL}/api/orders/track/${createdOrderNum}`)).json();
  const paymentEvent = trackAfterPay.events.find(e => e.status === 'payment_verification');
  assert(paymentEvent !== undefined, 'Payment verification event recorded in order timeline');

  // 7. Test Customer Order Cancellation & Inventory Restoration
  console.log('\n7. Customer Self-Cancellation & Stock Restoration:');
  const cancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrderNum}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({ reason: 'Customer changed delivery location' })
  });
  const cancelJson = await cancelRes.json();
  assert(cancelJson.success === true, 'Order cancellation succeeded');
  assert(cancelJson.order.status === 'cancelled', 'Order status marked cancelled');

  // Verify stock restored
  const restoredProdRes = await fetch(`${BASE_URL}/api/products/${testProduct.id}`);
  const restoredProdJson = await restoredProdRes.json();
  assert(restoredProdJson.product.stock === initialStock, `Inventory restored: stock back to ${restoredProdJson.product.stock}`);

  // Verify cancellation recorded in timeline
  const trackAfterCancel = await (await fetch(`${BASE_URL}/api/orders/track/${createdOrderNum}`)).json();
  const cancelEvent = trackAfterCancel.events.find(e => e.status === 'cancelled');
  assert(cancelEvent !== undefined, `Order cancellation event logged in database: "${cancelEvent.title}"`);

  // 8. Test Admin Order Progression
  console.log('\n8. Admin Order Lifecycle Progression:');
  // Create another order to test admin lifecycle progression
  await fetch(`${BASE_URL}/api/cart/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({ product_id: testProduct.id, quantity: 1 })
  });
  const o2Res = await (await fetch(`${BASE_URL}/api/orders/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${custToken}` },
    body: JSON.stringify({
      payment_method: 'COD',
      address_data: {
        full_name: 'Test Receiver',
        phone: '9123456780',
        house_building: 'Flat 4A',
        city: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001'
      }
    })
  })).json();
  const order2Id = o2Res.order.id;
  const order2Num = o2Res.order.order_number;

  // Progress: confirmed -> processing -> packed -> shipped -> delivered
  const stages = [
    { status: 'processing', notes: 'Picking products from warehouse shelf' },
    { status: 'packed', notes: 'Sealed in tamper-proof explosive box' },
    { status: 'shipped', tracking: 'TRK-EXP-999', notes: 'Dispatched via Sivakasi safe logistics' },
    { status: 'delivered', notes: 'Package delivered to customer' }
  ];

  for (const st of stages) {
    const updateRes = await fetch(`${BASE_URL}/api/admin/orders/${order2Id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: st.status,
        tracking_number: st.tracking || undefined,
        notes: st.notes
      })
    });
    const updateJson = await updateRes.json();
    assert(updateJson.success === true, `Admin updated status to "${st.status}"`);
  }

  // Verify all timeline events exist in order
  const o2Track = await (await fetch(`${BASE_URL}/api/orders/track/${order2Num}`)).json();
  assert(o2Track.events.length >= 5, `Order timeline contains all lifecycle events: ${o2Track.events.length}`);

  // 9. Test Inventory Management
  console.log('\n9. Admin Inventory Module:');
  const invRes = await fetch(`${BASE_URL}/api/admin/inventory`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const invJson = await invRes.json();
  assert(invJson.success === true, 'Admin inventory endpoint returned success');
  assert(invJson.inventory.length > 0, `Inventory list returned ${invJson.inventory.length} products`);
  assert(invJson.inventory[0].sku !== undefined, `Product SKU present: ${invJson.inventory[0].sku}`);
  assert(invJson.inventory[0].status !== undefined, `Stock status badge computed: "${invJson.inventory[0].status}"`);

  // Quick stock update
  const quickUpdateRes = await fetch(`${BASE_URL}/api/admin/inventory/${testProduct.id}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ stock: 99 })
  });
  const quickUpdateJson = await quickUpdateRes.json();
  assert(quickUpdateJson.success === true && quickUpdateJson.stock === 99, 'Inline stock quick update succeeded');

  // 10. Test Customers & Addresses Directory
  console.log('\n10. Customers & Addresses Directory:');
  const custsRes = await (await fetch(`${BASE_URL}/api/admin/customers`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  assert(custsRes.success === true && custsRes.customers.length > 0, `Customer directory returned ${custsRes.total_customers} registered users`);
  assert(custsRes.customers[0].lifetime_spent !== undefined, 'Customer lifetime spend aggregated from database');

  const addrsRes = await (await fetch(`${BASE_URL}/api/admin/addresses`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  assert(addrsRes.success === true && addrsRes.addresses.length > 0, `Addresses directory returned ${addrsRes.total_addresses} delivery addresses`);

  // 11. Test Coupons / Offers Management
  console.log('\n11. Offers & Coupons Module:');
  const newCouponCode = `TEST${Date.now().toString().slice(-4)}`;
  const createCouponRes = await fetch(`${BASE_URL}/api/admin/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      code: newCouponCode,
      description: 'Automated test discount offer',
      discount_type: 'percent',
      discount_value: 20,
      min_order_amount: 1000,
      max_discount_amount: 500
    })
  });
  const createCouponJson = await createCouponRes.json();
  assert(createCouponJson.success === true, `Admin created coupon: ${newCouponCode}`);

  // Toggle coupon
  const toggleRes = await fetch(`${BASE_URL}/api/admin/coupons/${createCouponJson.coupon.id}/toggle`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const toggleJson = await toggleRes.json();
  assert(toggleJson.success === true && toggleJson.is_active === 0, 'Admin toggled coupon to inactive');

  // Delete coupon
  const delCouponRes = await fetch(`${BASE_URL}/api/admin/coupons/${createCouponJson.coupon.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const delCouponJson = await delCouponRes.json();
  assert(delCouponJson.success === true, 'Admin deleted test coupon');

  // 12. Test Settings Management
  console.log('\n12. Settings Module:');
  const getSettingsRes = await (await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  assert(getSettingsRes.success === true, 'Admin settings retrieved');

  const saveSettingsRes = await (await fetch(`${BASE_URL}/api/admin/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      low_stock_threshold: '25',
      min_order_amount: '600'
    })
  })).json();
  assert(saveSettingsRes.success === true && saveSettingsRes.settings.low_stock_threshold === '25', 'Admin updated store settings');

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
