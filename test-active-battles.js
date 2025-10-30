const https = require('https');

async function testActiveBattles() {
  console.log('🧪 Testing production /api/battles/active endpoint...\n');

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

  console.log('\n✅ Token received\n');

  // Step 2: Get active battles
  console.log('Step 2: Fetching active battles...');
  const battlesOptions = {
    hostname: 'move-league-d.vercel.app',
    port: 443,
    path: '/api/battles/active',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const battlesResponse = await new Promise((resolve, reject) => {
    const req = https.request(battlesOptions, (res) => {
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

  console.log('✅ Active Battles API response:');
  console.log(JSON.stringify(battlesResponse, null, 2));
  console.log('\n📊 Battles count:', battlesResponse.data?.battles?.length || 0);
  
  if (battlesResponse.data?.battles) {
    console.log('\n⚔️ Battles:');
    battlesResponse.data.battles.forEach((battle, idx) => {
      console.log(`${idx + 1}. ${battle.title}`);
      console.log(`   Status: ${battle.status}`);
      console.log(`   Date: ${battle.scheduledDate}`);
      console.log(`   Time: ${battle.scheduledTime}`);
    });
  }
}

testActiveBattles().catch(err => {
  console.error('❌ Test failed:', err);
});
