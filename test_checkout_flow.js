const assert = require('assert');

async function runCheckoutTests() {
  console.log('🧪 Starting comprehensive testing of Customer Checkout & Address Management...');
  const baseUrl = 'http://localhost:5000';

  // 1. Register a fresh customer to test full onboarding
  const testEmail = `diwali_shopper_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Priya Sundaram',
      email: testEmail,
      phone: '9840123456',
      alt_phone: '9840654321',
      password: 'FestivePassword@123'
    })
  });
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true, 'Registration should succeed');
  const customerToken = regData.token;
  const customerId = regData.user.id;
  console.log(`✅ 1. Customer registration & session token verified (${regData.user.name})`);

  // 2. Guest cart to authenticated cart preservation
  const guestSession = `guest_flow_${Date.now()}`;
  const guestHeaders = { 'Content-Type': 'application/json', 'x-session-id': guestSession };

  // Add 2 products to guest cart
  const prodsRes = await fetch(`${baseUrl}/api/products`);
  const prodsData = await prodsRes.json();
  const prod1 = prodsData.products[0];
  const prod2 = prodsData.products[1];

  await fetch(`${baseUrl}/api/cart/add`, {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ product_id: prod1.id, quantity: 2 })
  });
  await fetch(`${baseUrl}/api/cart/add`, {
    method: 'POST',
    headers: guestHeaders,
    body: JSON.stringify({ product_id: prod2.id, quantity: 1 })
  });

  // Sync guest cart into new customer account
  const syncRes = await fetch(`${baseUrl}/api/cart/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ session_id: guestSession })
  });
  const syncData = await syncRes.json();
  assert.strictEqual(syncData.success, true);

  const customerCartRes = await fetch(`${baseUrl}/api/cart`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const customerCart = await customerCartRes.json();
  assert.strictEqual(customerCart.total_items, 3, 'Cart should preserve all 3 items across login');
  console.log(`✅ 2. Cart preservation upon login verified (Items: ${customerCart.items.length}, Qty: ${customerCart.total_items})`);

  // 3. Address Validation: Rejection on invalid data
  const invalidAddrRes = await fetch(`${baseUrl}/api/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      full_name: 'P',
      phone: '123', // invalid phone
      house_building: '',
      street_area: '',
      city: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: 'abc' // invalid pincode
    })
  });
  const invalidAddrData = await invalidAddrRes.json();
  assert.strictEqual(invalidAddrRes.status, 400, 'Server must reject invalid address data');
  console.log('✅ 3. Address validation rules verified (Invalid phone/pincode rejected)');

  // 4. Address Book CRUD: Create Address 1
  const addr1Res = await fetch(`${baseUrl}/api/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      full_name: 'Priya Sundaram',
      phone: '9840123456',
      alt_phone: '9840654321',
      house_building: 'Flat 4B, Meenakshi Heights',
      street_area: '12 Anna Nagar Main Road',
      landmark: 'Opposite Town Hall',
      city: 'Madurai',
      district: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625020',
      is_default: 1
    })
  });
  const addr1Data = await addr1Res.json();
  assert.strictEqual(addr1Data.success, true);
  const addr1Id = addr1Data.address.id;
  assert.strictEqual(addr1Data.address.is_default, 1, 'First address should be default');
  console.log(`✅ 4. Address creation verified (Address ID: ${addr1Id})`);

  // 5. Create Address 2 & set as default
  const addr2Res = await fetch(`${baseUrl}/api/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      full_name: 'Priya Office Depot',
      phone: '9840999888',
      house_building: 'Plot 7, Tech Park',
      street_area: 'Ring Road Bypass',
      landmark: 'Near Toll Plaza',
      city: 'Sivakasi',
      district: 'Virudhunagar',
      state: 'Tamil Nadu',
      pincode: '626123',
      is_default: 1
    })
  });
  const addr2Data = await addr2Res.json();
  assert.strictEqual(addr2Data.success, true);
  const addr2Id = addr2Data.address.id;

  // Verify Address 2 is now default and Address 1 is not
  const listRes1 = await fetch(`${baseUrl}/api/addresses`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const listData1 = await listRes1.json();
  assert.strictEqual(listData1.addresses.length, 2);
  const fetchedAddr1 = listData1.addresses.find(a => a.id === addr1Id);
  const fetchedAddr2 = listData1.addresses.find(a => a.id === addr2Id);
  assert.strictEqual(fetchedAddr2.is_default, 1, 'Address 2 must be default');
  assert.strictEqual(fetchedAddr1.is_default, 0, 'Address 1 should have default reset');
  console.log('✅ 5. Default address management verified');

  // 6. Edit Address 1
  const editRes = await fetch(`${baseUrl}/api/addresses/${addr1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      house_building: 'Flat 4B, Meenakshi Towers (Renovated)',
      street_area: '14 Anna Nagar Main Road',
      city: 'Madurai',
      district: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625020'
    })
  });
  const editData = await editRes.json();
  assert.strictEqual(editData.success, true);
  assert(editData.address.house_building.includes('Renovated'));
  console.log('✅ 6. Address editing verified');

  // 7. Security: Cross-user address access prevention
  const otherCustomerLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@gmail.com', password: 'Customer@123' })
  });
  const otherCustomer = await otherCustomerLogin.json();
  const otherToken = otherCustomer.token;

  // Other user trying to edit Priya's address
  const illegalEditRes = await fetch(`${baseUrl}/api/addresses/${addr1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${otherToken}`
    },
    body: JSON.stringify({ house_building: 'Hacked Building' })
  });
  assert.strictEqual(illegalEditRes.status, 404, 'Must deny cross-user address modification');
  console.log('✅ 7. Cross-customer data isolation & authorization verified');

  // 8. Zero-Trust Price Validation Test:
  // Client attempts to send manipulated subtotal or grand_total
  const tamperedOrderRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      address_id: addr2Id,
      payment_method: 'COD',
      subtotal: 10,       // Manipulated fake subtotal
      grand_total: 10,    // Manipulated fake grand total
      price: 1            // Manipulated fake unit price
    })
  });
  const tamperedOrderData = await tamperedOrderRes.json();
  assert.strictEqual(tamperedOrderData.success, true);
  // Real price in DB: prod1.price * 2 + prod2.price * 1
  const expectedSubtotal = (prod1.price * 2) + (prod2.price * 1);
  assert.strictEqual(tamperedOrderData.order.subtotal, expectedSubtotal, 'Server must compute subtotal from database prices');
  console.log(`✅ 8. Zero-Trust Price Security verified (Backend charged ₹${tamperedOrderData.order.grand_total}, ignored manipulated price)`);

  // 9. Stock Validation Test:
  // Add item to cart, then simulate concurrent inventory reduction
  await fetch(`${baseUrl}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ product_id: prod1.id, quantity: 2 })
  });

  // Temporarily reduce stock in database directly to simulate a concurrent purchase
  const db = require('./server/db/database');
  const originalStock = db.prepare('SELECT stock FROM products WHERE id = ?').get(prod1.id).stock;
  db.prepare('UPDATE products SET stock = 1 WHERE id = ?').run(prod1.id);

  const excessiveOrderRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      address_id: addr2Id,
      payment_method: 'COD'
    })
  });
  const excessiveOrderData = await excessiveOrderRes.json();
  assert.strictEqual(excessiveOrderRes.status, 400, 'Server must reject when quantity exceeds stock');
  assert(excessiveOrderData.message.toLowerCase().includes('stock') || excessiveOrderData.message.toLowerCase().includes('inventory'));
  console.log('✅ 9. Stock quantity enforcement verified (Server-side inventory validation passed)');

  // Restore original stock
  db.prepare('UPDATE products SET stock = ? WHERE id = ?').run(originalStock, prod1.id);

  // Clear cart
  await fetch(`${baseUrl}/api/cart/clear`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  // 10. Historical Address Snapshot Integrity Test:
  // Place legitimate order with Address 1
  await fetch(`${baseUrl}/api/cart/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({ product_id: prod2.id, quantity: 1 })
  });

  const legitimateOrderRes = await fetch(`${baseUrl}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      address_id: addr1Id,
      payment_method: 'COD'
    })
  });
  const legitimateOrderData = await legitimateOrderRes.json();
  assert.strictEqual(legitimateOrderData.success, true);
  const snapshotBefore = JSON.parse(legitimateOrderData.order.address_snapshot);
  assert(snapshotBefore.houseBuilding.includes('Renovated'));

  // Now delete or re-edit Address 1 in the address book
  await fetch(`${baseUrl}/api/addresses/${addr1Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      house_building: 'Brand New Villa 99',
      street_area: 'Changed Street',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001'
    })
  });

  // Check that historical order snapshot remains exactly as it was when placed!
  const trackOrderRes = await fetch(`${baseUrl}/api/orders/track/${legitimateOrderData.order.order_number}`);
  const trackOrderData = await trackOrderRes.json();
  assert(trackOrderData.order.parsed_address.houseBuilding.includes('Renovated'), 'Order snapshot must be immutable');
  assert.strictEqual(trackOrderData.order.parsed_address.city, 'Madurai', 'City in snapshot must not change');
  console.log('✅ 10. Historical address snapshot immutability verified');

  // 11. Delete Address test & automatic default promotion
  const deleteRes = await fetch(`${baseUrl}/api/addresses/${addr2Id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const deleteData = await deleteRes.json();
  assert.strictEqual(deleteData.success, true);

  const afterDeleteList = await fetch(`${baseUrl}/api/addresses`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const afterDeleteData = await afterDeleteList.json();
  assert.strictEqual(afterDeleteData.addresses.length, 1);
  assert.strictEqual(afterDeleteData.addresses[0].is_default, 1, 'Remaining address promoted to default');
  console.log('✅ 11. Address deletion & default fallback promotion verified');

  console.log('\n🎉 ALL 11 CHECKOUT & ADDRESS MANAGEMENT SUITE TESTS PASSED! 🎆\n');
}

runCheckoutTests().catch(err => {
  console.error('❌ Checkout tests failed:', err);
  process.exit(1);
});
