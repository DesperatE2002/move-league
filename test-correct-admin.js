// Test correct admin credentials
const adminEmail = "admin@mleague.com";
const adminPassword = "MoveLeague2025!";

async function testCorrectAdmin() {
  try {
    console.log("🔐 Step 1: Login with correct password...");
    
    const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });

    const loginData = await loginResponse.json();
    console.log("Login response:", JSON.stringify(loginData, null, 2));
    
    if (!loginData.success) {
      console.error("❌ Login failed!");
      return;
    }

    const token = loginData.data.token;
    console.log("\n✅ Token received:", token);
    
    // Decode token to see format
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      console.log("📝 Decoded token:", decoded);
      console.log("🆔 User ID:", decoded.includes(":") ? decoded.split(":")[0] : decoded);
    } catch (e) {
      console.error("❌ Token decode error:", e.message);
    }

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

    if (usersData.success && usersData.data.users) {
      console.log(`\n✅ Found ${usersData.data.users.length} users`);
      usersData.data.users.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - ${u.role}`);
      });
    }

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

testCorrectAdmin();
