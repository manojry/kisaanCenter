const http = require('http');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testTransactionNames() {
  try {
    console.log('🔍 Testing transaction API with names...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/transactions?shop_id=1&include_analytics=true',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    console.log('Response status:', response.status);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const transaction = response.data.data[0];
      console.log('\n📋 Sample transaction:');
      console.log(JSON.stringify(transaction, null, 2));
      
      // Check if names are included
      if (transaction.buyer_name) {
        console.log('✅ buyer_name found:', transaction.buyer_name);
      } else {
        console.log('❌ buyer_name missing, only buyer_id:', transaction.buyer_id);
      }
      
      if (transaction.farmer_name) {
        console.log('✅ farmer_name found:', transaction.farmer_name);
      } else {
        console.log('❌ farmer_name missing, farmer_id:', transaction.farmer_id || 'N/A');
      }
      
      if (transaction.product_name) {
        console.log('✅ product_name found:', transaction.product_name);
      } else {
        console.log('❌ product_name missing, only product_id:', transaction.product_id);
      }
      
      // Check if all required fields are present
      const requiredFields = ['farmer_name', 'buyer_name', 'product_name'];
      const missingFields = requiredFields.filter(field => !transaction[field]);
      
      if (missingFields.length === 0) {
        console.log('\n🎉 SUCCESS: All name fields are present!');
      } else {
        console.log('\n⚠️  ISSUE: Missing fields:', missingFields.join(', '));
        console.log('Backend service changes may not be applied. Server restart needed?');
      }
    } else {
      console.log('❌ No transactions found in response');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTransactionNames();