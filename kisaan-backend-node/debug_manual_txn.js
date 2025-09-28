const axios = require('axios');

(async () => {
  const BASE = process.env.KISAAN_API_BASE || 'http://localhost:8000/api';
  const cred = { username: 'superadmin', password: 'superadminpass' };
  function log(label, data){
    console.log(`\n=== ${label} ===`);
    console.dir(data, {depth:3});
  }
  try {
    const login = await axios.post(`${BASE}/auth/login`, cred);
    const token = login.data?.data?.token;
    log('login', login.data);
    const headers = { Authorization: `Bearer ${token}` };

    // Create temp owner
    const ownerUsername = 'owner_debug_txn';
    let owner;
    try {
      owner = await axios.post(`${BASE}/users`, { username: ownerUsername, password:'pass123', email:`${ownerUsername}@test.com`, role:'owner', phone:'9999999000' }, { headers });
    } catch(e){
      log('owner create error', e.response?.data || e.message);
      const list = await axios.get(`${BASE}/users`, { headers });
      owner = { data: list.data.data.find(u=>u.username===ownerUsername) ? { data: { user: list.data.data.find(u=>u.username===ownerUsername) } } : null };
    }
    const ownerId = owner.data?.data?.user?.id || owner.data?.data?.id || owner.data?.id;
    log('owner', owner.data || owner);

    // Create shop
    let shop;
    try {
      shop = await axios.post(`${BASE}/shops`, { name:'Debug Shop Txn', owner_id: ownerId, address:'A', location:'L', contact:'C', plan_id:1, commission_rate:5 }, { headers });
    } catch(e){
      log('shop create error', e.response?.data || e.message);
      const shops = await axios.get(`${BASE}/shops`, { headers });
      shop = { data: { data: shops.data.data.find(s=>String(s.owner_id)===String(ownerId)) } };
    }
    const shopId = shop.data?.data?.id || shop.data?.data?.shop?.id || shop.data?.id;
    log('shop', shop.data || shop);

    // Create farmer + buyer
    const farmerUsername = 'farmer_debug_txn';
    const buyerUsername = 'buyer_debug_txn';
    async function ensureUser(username, role){
      try {
        return await axios.post(`${BASE}/users`, { username, password:'pass123', email:`${username}@test.com`, role, phone:'9999999'+Math.floor(Math.random()*1000), shop_id: shopId }, { headers });
      } catch(e){
        const list = await axios.get(`${BASE}/users`, { headers });
        const existing = list.data.data.find(u=>u.username===username);
        return { data: { data: { user: existing } } };
      }
    }
    const farmer = await ensureUser(farmerUsername, 'farmer');
    const buyer = await ensureUser(buyerUsername, 'buyer');
    const farmerId = farmer.data.data.user.id; const buyerId = buyer.data.data.user.id;
    log('farmer', farmer.data); log('buyer', buyer.data);

    // Products
    const products = await axios.get(`${BASE}/products`, { headers });
    log('products meta', { count: products.data.data.length });
    const product = products.data.data[0];

    // Assign product to shop (ignore duplicate)
    try { await axios.post(`${BASE}/shops/${shopId}/products/${product.id}`, {}, { headers }); } catch(e){ log('shop product link error', e.response?.data || e.message); }

    // Assign product to farmer
    try { const assign = await axios.post(`${BASE}/farmer-products/farmers/${farmerId}/products`, { product_id: product.id, make_default:true }, { headers }); log('farmer assign', assign.data); }
    catch(e){ log('farmer assign error', e.response?.data || e.message); }

    // List farmer products
    try { const fplist = await axios.get(`${BASE}/farmer-products/farmers/${farmerId}/products`, { headers }); log('farmer products list', fplist.data); } catch(e){ log('farmer products list error', e.response?.data || e.message); }

    // Create transaction
    try {
      const txn = await axios.post(`${BASE}/transactions`, { shop_id: shopId, farmer_id: farmerId, buyer_id: buyerId, category_id: product.category_id, product_name: product.name, product_id: product.id, quantity: 10, unit_price: 50, commission_rate:5 }, { headers });
      log('transaction', txn.data);
    } catch(e){
      log('transaction error', e.response?.data || e.message);
    }

  } catch(err){
    console.error('fatal', err);
  }
})();