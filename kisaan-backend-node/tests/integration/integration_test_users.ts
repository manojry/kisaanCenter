import axios from 'axios';

const users = [
  { username: 'superadmin', password: 'superadminpass', role: 'superadmin' },
  { username: 'OWN123', password: 'ownerpass', role: 'owner' },
  { username: 'ram_OWN123', password: 'farmerpass', role: 'farmer' },
  { username: 'shyam_OWN123', password: 'buyerpass', role: 'buyer' },
];

const loginUrl = 'http://localhost:3000/api/v1/auth/login';
const testEndpoint = 'http://localhost:3000/api/v1/users'; // Test with existing users endpoint

async function testLogin(user: { username: string; password: string; role: string }) {
  try {
    const response = await axios.post(loginUrl, {
      username: user.username,
      password: user.password,
    });
    console.log(`\n[${user.role}] Login status: ${response.status}`);
    console.log(`[${user.role}] Response data:`, JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.token) {
      const token = response.data.token;
      console.log(`[${user.role}] Login successful! Token: ${token?.slice(0, 20)}...`);
      console.log(`[${user.role}] User:`, response.data.user);
      // Test authenticated endpoint
      if (token) {
        try {
          const dashResp = await axios.get(testEndpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(`[${user.role}] Dashboard status: ${dashResp.status}`);
        } catch (err: any) {
          console.log(`[${user.role}] Dashboard error:`, err.response?.status, err.response?.data);
        }
      }
    } else {
      console.log(`[${user.role}] Login failed: ${response.data?.message || 'No token in response'}`);
    }
  } catch (err: any) {
    console.log(`[${user.role}] Login error:`, err.response?.status, err.response?.data);
  }
}

(async () => {
  for (const user of users) {
    await testLogin(user);
  }
})();
