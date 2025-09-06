import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
const ownerCreds = { username: 'owner1', password: 'owner1pass' };

let token: string;
let shopId: number | string;
let userId: number | string;

async function loginOwner() {
  console.log('\n🔐 Logging in as owner...');
  console.log('Login payload:', ownerCreds);
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, ownerCreds);
    if (res.status === 200 && res.data.token && res.data.user) {
      token = res.data.token;
      userId = res.data.user.id;
      // shopId may not be present in user, so fetch it if needed
      shopId = res.data.user.shop_id || shopId;
      console.log(`✅ Login successful! User ID: ${userId}, Shop ID: ${shopId}`);
    } else {
      console.error('Login failed, response:', res.data);
      throw new Error('Owner login failed');
    }
  } catch (error: any) {
    if (error.response) {
      console.error('Login error response:', JSON.stringify(error.response.data, null, 2));
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    } else {
      console.error('Login error:', error.message);
    }
    throw new Error('Owner login failed');
  }
}

async function fetchShopAnalytics() {
  console.log('\n📊 Fetching shop analytics...');
  const res = await axios.get(`${API_BASE}/owner-admin/shops/${shopId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && res.data.success) {
    console.log('✅ Analytics:', Object.keys(res.data.data));
  } else {
    throw new Error('Shop analytics fetch failed');
  }
}

async function fetchShopUsers() {
  console.log('\n👥 Fetching shop users...');
  const res = await axios.get(`${API_BASE}/owner-admin/shops/${shopId}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && res.data.success) {
    const users = res.data.data;
    console.log(`✅ Users retrieved: ${Array.isArray(users) ? users.length : 'N/A'}`);
    return users;
  } else {
    throw new Error('Shop users fetch failed');
  }
}

async function fetchShopProducts() {
  console.log('\n🛒 Fetching shop products...');
  const res = await axios.get(`${API_BASE}/owner-admin/shops/${shopId}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && res.data.success) {
    const products = res.data.data;
    console.log(`✅ Products retrieved: ${Array.isArray(products) ? products.length : 'N/A'}`);
    return products;
  } else {
    throw new Error('Shop products fetch failed');
  }
}

async function createFarmerUser() {
  console.log('\n👤 Creating a new farmer user...');
  const timestamp = Date.now();
  const userData = [{
    username: `farmer_seeded_${timestamp}`,
    password: 'farmer1pass',
    role: 'farmer',
    shop_id: shopId,
    contact: '9876543211',
    credit_limit: 5000.0,
    email: `farmer_seeded_${timestamp}@kisaan.com`,
    owner_id: 'OWNER_001',
    status: 'active',
    created_by: 2
  }];
  const res = await axios.post(`${API_BASE}/owner-admin/shops/${shopId}/users`, userData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && res.data.success) {
    console.log('✅ Farmer user created:', res.data.data);
  } else {
    throw new Error('Farmer user creation failed');
  }
}

async function createTransaction(buyers: any[], products: any[]) {
  console.log('\n💰 Creating a transaction...');
  if (!buyers.length || !products.length) throw new Error('No buyers or products available');
  // Use seeded buyer1 details if available
  const buyer = buyers.find((b: any) => b.username === 'buyer1') || buyers[0];
  const txnData = {
    buyer_user_id: buyer.id,
    type: 'sale',
    commission_rate: 5.0,
    date: new Date().toISOString().slice(0, 10),
    items: [{ product_id: products[0].id, quantity: 2.0, price_per_unit: 100.0 }],
    farmer_paid_amount: 0,
    commission_confirmed: false,
    buyer_paid_amount: 0,
    shop_id: shopId,
  };
  const res = await axios.post(`${API_BASE}/transactions`, txnData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if ((res.status === 200 || res.status === 201) && res.data.success) {
    console.log('✅ Transaction created:', res.data.data.id);
  } else {
    throw new Error('Transaction creation failed');
  }
}

async function fetchTodaysTransactions() {
  console.log("\n📅 Fetching today's transactions...");
  const today = new Date().toISOString().slice(0, 10);
  const res = await axios.get(`${API_BASE}/transactions?shop_id=${shopId}&date_from=${today}&date_to=${today}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 200 && res.data.success) {
    console.log(`✅ Today's transactions: ${Array.isArray(res.data.data) ? res.data.data.length : 'N/A'}`);
  } else {
    throw new Error('Fetching today\'s transactions failed');
  }
}

async function runOwnerIntegrationTest() {
  console.log('🚀 Starting Owner Integration Test');
  console.log('='.repeat(60));
  try {
    await loginOwner();
    await fetchShopAnalytics();
    const users = await fetchShopUsers();
    const buyers = Array.isArray(users) ? users.filter((u: any) => u.role === 'buyer') : [];
    const products = await fetchShopProducts();
    await createFarmerUser();
    await createTransaction(buyers, products);
    await fetchTodaysTransactions();
    console.log('\n✅ All Owner Integration Steps Passed!');
    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ Owner Integration Test Failed.`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  runOwnerIntegrationTest();
}
