// API Test Helper
// Bu dosyayı kullanarak API endpoint'lerini test edebilirsiniz

// Test Hesapları:
// Dancers:
// - dancer1@test.com (Ahmet Yıldız) 
// - dancer2@test.com (Zeynep Kaya)
// - dancer3@test.com (Mehmet Demir)
// Password: password123

// Studios:
// - studio1@test.com (Adana Dans Stüdyosu)
// - studio2@test.com (Merkez Park Stüdyosu)
// - studio3@test.com (Urban Dance Academy)
// Password: password123

// Admin:
// - admin@moveleague.com
// Password: admin123

const BASE_URL = 'http://localhost:3000/api';

// 1. LOGIN TEST
async function testLogin() {
  console.log('\n=== LOGIN TEST ===');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'dancer1@test.com',
      password: 'password123',
    }),
  });
  
  const data = await response.json();
  console.log('Login Response:', data);
  
  if (data.success && data.data.token) {
    return data.data.token;
  }
  
  throw new Error('Login failed');
}

// 2. GET USERS TEST
async function testGetUsers(token: string) {
  console.log('\n=== GET USERS TEST ===');
  
  const response = await fetch(`${BASE_URL}/users?role=DANCER`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const data = await response.json();
  console.log('Users Response:', data);
}

// 3. CREATE BATTLE TEST
async function testCreateBattle(token: string) {
  console.log('\n=== CREATE BATTLE TEST ===');
  
  // Get users first to find a challenger
  const usersResponse = await fetch(`${BASE_URL}/users?role=DANCER`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const usersData = await usersResponse.json();
  const challenged = usersData.data.find((u: any) => u.email === 'dancer2@test.com');
  
  const response = await fetch(`${BASE_URL}/battles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      challengedId: challenged.id,
      danceStyle: 'Hip-Hop',
      description: 'API Test Battle',
    }),
  });
  
  const data = await response.json();
  console.log('Create Battle Response:', data);
  
  return data.data?.id;
}

// 4. GET BATTLES TEST
async function testGetBattles(token: string) {
  console.log('\n=== GET BATTLES TEST ===');
  
  const response = await fetch(`${BASE_URL}/battles`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const data = await response.json();
  console.log('Battles Response:', data);
}

// 5. ACCEPT BATTLE TEST
async function testAcceptBattle(token: string, battleId: string) {
  console.log('\n=== ACCEPT BATTLE TEST ===');
  
  const response = await fetch(`${BASE_URL}/battles/${battleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      action: 'ACCEPT',
    }),
  });
  
  const data = await response.json();
  console.log('Accept Battle Response:', data);
}

// 6. GET NOTIFICATIONS TEST
async function testGetNotifications(token: string) {
  console.log('\n=== GET NOTIFICATIONS TEST ===');
  
  const response = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const data = await response.json();
  console.log('Notifications Response:', data);
}

// 7. GET STUDIOS TEST
async function testGetStudios(token: string) {
  console.log('\n=== GET STUDIOS TEST ===');
  
  const response = await fetch(`${BASE_URL}/studios`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const data = await response.json();
  console.log('Studios Response:', data);
}

// RUN ALL TESTS
async function runAllTests() {
  try {
    // Login as dancer1
    const token = await testLogin();
    
    // Test endpoints
    await testGetUsers(token);
    await testGetStudios(token);
    await testGetBattles(token);
    await testGetNotifications(token);
    
    // Create a new battle
    const battleId = await testCreateBattle(token);
    
    if (battleId) {
      // Login as dancer2 to accept the battle
      console.log('\n=== SWITCHING TO DANCER2 ===');
      const dancer2Response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'dancer2@test.com',
          password: 'password123',
        }),
      });
      const dancer2Data = await dancer2Response.json();
      const dancer2Token = dancer2Data.data.token;
      
      // Check notifications
      await testGetNotifications(dancer2Token);
      
      // Accept the battle
      await testAcceptBattle(dancer2Token, battleId);
      
      // Check battles again
      await testGetBattles(dancer2Token);
    }
    
    console.log('\n=== ALL TESTS COMPLETED ===');
  } catch (error) {
    console.error('Test Error:', error);
  }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests };
}

// Export for browser
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
}
