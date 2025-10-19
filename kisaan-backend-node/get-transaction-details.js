// Get transaction details to check status
const axios = require('axios');

async function getTransactionDetails() {
  try {
    console.log('Logging in...');
    const login = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Getting transaction 56 details...');
    const txResponse = await axios.get('http://localhost:8000/api/transactions/56', { headers });
    console.log('Transaction details:', JSON.stringify(txResponse.data.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

getTransactionDetails();