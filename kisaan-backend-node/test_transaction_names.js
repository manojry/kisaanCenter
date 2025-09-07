const axios = require('axios');

async function testTransactionNames() {
  try {
    console.log('Testing transaction API with names...');
    
    const response = await axios.get('http://localhost:3000/api/transactions?shop_id=1&include_analytics=true');
    
    console.log('Response status:', response.status);
    console.log('Sample transaction:', JSON.stringify(response.data.data[0], null, 2));
    
    const transaction = response.data.data[0];
    
    // Check if names are included
    if (transaction.buyer_name) {
      console.log('✅ buyer_name found:', transaction.buyer_name);
    } else {
      console.log('❌ buyer_name missing, only buyer_id:', transaction.buyer_id);
    }
    
    if (transaction.farmer_name) {
      console.log('✅ farmer_name found:', transaction.farmer_name);
    } else {
      console.log('❌ farmer_name missing, only farmer_id:', transaction.farmer_id);
    }
    
    if (transaction.product_name) {
      console.log('✅ product_name found:', transaction.product_name);
    } else {
      console.log('❌ product_name missing, only product_id:', transaction.product_id);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testTransactionNames();