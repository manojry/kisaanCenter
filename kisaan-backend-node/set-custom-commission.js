// Set custom commission rate for farmer
const axios = require('axios');

async function setCustomCommission() {
  try {
    console.log('Logging in...');
    const login = await axios.post('http://localhost:8000/api/auth/login', {
      username: 'ramakanthreddy_0_107',
      password: 'reddy@123'
    });
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    console.log('Setting custom commission rate for farmer 3...');
    const response = await axios.patch('http://localhost:8000/api/users/3/commission', 
      { custom_commission_rate: 15 }, 
      { headers }
    );
    console.log('Response:', response.data);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

setCustomCommission();