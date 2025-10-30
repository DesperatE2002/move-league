const fetch = require('node-fetch');

async function testUsersAPI() {
  console.log('🧪 Testing /api/users/all endpoint...\n');

  // Admin login first
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@mleague.com',
      password: 'MoveLeague2025!'
    })
  });

  const loginData = await loginRes.json();
  console.log('Login response:', loginData);

  if (!loginData.token) {
    console.error('❌ Login failed!');
    return;
  }

  const token = loginData.token;
  console.log('✅ Token:', token.substring(0, 20) + '...\n');

  // Get all users
  const usersRes = await fetch('http://localhost:3000/api/users/all', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const usersData = await usersRes.json();
  console.log('Users API response:', JSON.stringify(usersData, null, 2));
  console.log('\n📊 Total users:', usersData.users?.length || 0);
}

testUsersAPI().catch(console.error);
