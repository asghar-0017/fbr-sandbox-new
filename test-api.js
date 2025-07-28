import axios from 'axios';

async function testTenantAPI() {
  try {
    // First, let's login to get a token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('Login successful, token:', token);
    
    // Now test the tenants endpoint
    const tenantsResponse = await axios.get('http://localhost:3000/api/admin/tenants', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Tenants API response:', JSON.stringify(tenantsResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testTenantAPI(); 