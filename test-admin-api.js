// Test admin users API
const adminEmail = "admin@mleague.com";
const adminPassword = "123456";

async function testAdminAPI() {
  try {
    console.log("🔐 Step 1: Login as admin...");
    
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });

    const loginData = await loginResponse.json();
    console.log("Login response:", loginData);
    
    if (!loginData.success) {
      console.error("❌ Login failed!");
      return;
    }

    const token = loginData.data.token;
    console.log("✅ Token:", token);

    console.log("\n🔍 Step 2: Fetch all users...");
    
    const usersResponse = await fetch("http://localhost:3000/api/admin/users?page=1&limit=20", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Users API status:", usersResponse.status);
    const usersData = await usersResponse.json();
    console.log("Users API response:", JSON.stringify(usersData, null, 2));

    console.log("\n🔍 Step 3: Search for 'miray'...");
    
    const searchResponse = await fetch("http://localhost:3000/api/admin/users?page=1&limit=20&search=miray", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    console.log("Search API status:", searchResponse.status);
    const searchData = await searchResponse.json();
    console.log("Search API response:", JSON.stringify(searchData, null, 2));

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testAdminAPI();
