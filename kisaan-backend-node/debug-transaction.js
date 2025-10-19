// Debug transaction creation
const axios = require('axios');

async function debugTransaction() {
  try {
    console.log('Logging in...');
    const login = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Creating transaction...');
    const transactionData = {
      shop_id: 1,
      farmer_id: 3,
      buyer_id: 4,
      category_id: 1,
      product_name: 'Roses',
      quantity: 5,
      unit_price: 20.00,
      transaction_date: new Date().toISOString(),
      notes: 'Debug transaction'
    };

    console.log('Transaction data:', JSON.stringify(transactionData, null, 2));

    const response = await axios.post('http://localhost:8000/api/transactions/', transactionData, { headers });
    console.log('Success:', response.data);

  } catch(e) {
    console.log('Error status:', e.response?.status);
    console.log('Error data:', JSON.stringify(e.response?.data, null, 2));
    if (e.response?.data?.details) {
      console.log('Error details:', e.response.data.details);
    }
  }
}

debugTransaction();