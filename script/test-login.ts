import "dotenv/config";

async function testFacultyLogin() {
  const baseUrl = "http://localhost:5000";

  console.log("🧪 Testing Faculty Login Functionality");
  console.log("=====================================");

  // Test faculty login
  const facultyCredentials = {
    username: "john.doe",
    password: "faculty123"
  };

  console.log(`\n🔐 Testing login with: ${facultyCredentials.username} / ${facultyCredentials.password}`);

  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(facultyCredentials),
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log("✅ Login successful!");
      console.log("User data:", {
        id: loginData.user._id,
        username: loginData.user.username,
        role: loginData.user.role,
        email: loginData.user.email
      });

      // Test accessing protected route with session
      console.log("\n🔒 Testing protected route access...");
      const hallsResponse = await fetch(`${baseUrl}/api/halls`, {
        credentials: "include",
      });

      if (hallsResponse.ok) {
        const halls = await hallsResponse.json();
        console.log("✅ Protected route access successful!");
        console.log(`Found ${halls.length} halls in database`);
      } else {
        console.log("❌ Protected route access failed:", hallsResponse.status);
      }

      // Test logout
      console.log("\n🚪 Testing logout...");
      const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (logoutResponse.ok) {
        console.log("✅ Logout successful!");
      } else {
        console.log("❌ Logout failed:", logoutResponse.status);
      }

    } else {
      const error = await loginResponse.json();
      console.log("❌ Login failed:", error.message);
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testFacultyLogin().catch(console.error);