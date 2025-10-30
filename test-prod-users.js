const https = require('https');

async function testProdUsersAPI() {
  console.log('🧪 Testing production /api/users/all endpoint...\n');

  // Step 1: Login
  console.log('Step 1: Logging in as admin...');
  const loginData = JSON.stringify({
    email: 'admin@mleague.com',
    password: 'MoveLeague2025!'
  });

  const loginOptions = {
    hostname: 'move-league-d.vercel.app',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const token = await new Promise((resolve, reject) => {
    const req = https.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Login response:', parsed);
          if (parsed.data?.token) {
            resolve(parsed.data.token);
          } else {
            reject(new Error('No token in response'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('\n✅ Token received:', token.substring(0, 30) + '...\n');

  // Step 2: Get all users
  console.log('Step 2: Fetching all users...');
  const usersOptions = {
    hostname: 'move-league-d.vercel.app',
    port: 443,
    path: '/api/users/all',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const usersResponse = await new Promise((resolve, reject) => {
    const req = https.request(usersOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });

  console.log('✅ Users API response:');
  console.log(JSON.stringify(usersResponse, null, 2));
  console.log('\n📊 Response structure:');
  console.log('- success:', usersResponse.success);
  console.log('- data:', typeof usersResponse.data);
  console.log('- data.users:', Array.isArray(usersResponse.data?.users));
  console.log('- users count:', usersResponse.data?.users?.length || 0);
  
  if (usersResponse.data?.users) {
    console.log('\n👥 Users:');
    usersResponse.data.users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
  }
}

testProdUsersAPI().catch(err => {
  console.error('❌ Test failed:', err);
});
