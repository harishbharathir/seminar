// Quick debug script to test login

async function testLogin() {
  const baseUrl = "http://localhost:5000";
  
  console.log("Testing faculty login...");
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        username: "john.doe", 
        password: "faculty123" 
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Login successful!");
      console.log("User:", data.user);
    } else {
      const error = await response.json();
      console.log("❌ Login failed:", error.message);
    }
  } catch (err) {
    console.log("❌ Network error:", err.message);
  }
}

testLogin();