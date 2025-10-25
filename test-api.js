// API Test Script
require('dotenv').config();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://move-league-d.vercel.app/api';

async function testAPI() {
  console.log('\n🧪 Testing API...\n');

  // 1. Login as referee
  console.log('1️⃣ Logging in as referee...');
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'tahsin@moveleague.com',
      password: 'tahsin123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('Login response:', loginData.success ? '✅ Success' : '❌ Failed');
  
  if (!loginData.success) {
    console.log('Error:', loginData.message);
    return;
  }

  const token = loginData.data.token;
  const user = loginData.data.user;
  console.log('User:', user);
  console.log('User ID:', user.id);
  console.log('User Role:', user.role);

  // 2. Get battles
  console.log('\n2️⃣ Fetching battles...');
  const battlesResponse = await fetch(`${API_URL}/battles`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const battlesData = await battlesResponse.json();
  console.log('Battles response:', battlesData.success ? '✅ Success' : '❌ Failed');
  
  if (!battlesData.success) {
    console.log('Error:', battlesData.message);
    return;
  }

  const battles = battlesData.data || [];
  console.log(`Total battles: ${battles.length}`);
  
  battles.forEach((b, idx) => {
    console.log(`\n${idx + 1}. ${b.initiator?.name} vs ${b.challenged?.name}`);
    console.log(`   ID: ${b.id}`);
    console.log(`   Status: ${b.status}`);
    console.log(`   Referee ID: ${b.refereeId || 'None'}`);
    console.log(`   Referee: ${b.referee?.name || 'None'}`);
    console.log(`   Match: ${b.refereeId === user.id ? '✅ YES' : '❌ NO'}`);
  });

  // 3. Filter battles for referee
  const myBattles = battles.filter(b => 
    b.refereeId === user.id && 
    ['CONFIRMED', 'BATTLE_SCHEDULED', 'STUDIO_PENDING'].includes(b.status)
  );

  console.log(`\n3️⃣ Filtered battles for referee: ${myBattles.length}`);
  myBattles.forEach((b, idx) => {
    console.log(`${idx + 1}. ${b.initiator?.name} vs ${b.challenged?.name}`);
  });
}

testAPI().catch(console.error);
