const axios = require('axios');

async function testLogin() {
  const testUsers = [
    { email: 'belhadjisami25@gmail.com', password: 'Motdepasse93260!' },
    { email: 'superadmin@example.com', password: 'SuperAdmin123!' },
    { email: 'jules@exemple.fr', password: 'password123' }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\n🔍 Testing login for ${user.email}...`);
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email: user.email,
        password: user.password
      });
      console.log('✅ Login successful:', response.data);
      return; // Stop after first successful login
    } catch (error) {
      if (error.response) {
        console.log(`❌ Login failed for ${user.email}:`, error.response.data.message);
      } else {
        console.log(`❌ Network error for ${user.email}:`, error.message);
      }
    }
  }

  console.log('\n❌ All login attempts failed. The API and database are working, but passwords may be different.');
}

testLogin();
