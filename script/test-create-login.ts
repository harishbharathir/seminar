import "dotenv/config";

async function testUserCreationAndLogin() {
  const baseUrl = "http://localhost:5000";

  console.log("🧪 Testing User Creation and Login");
  console.log("==================================");

  // First, login as admin
  console.log("\n🔐 Logging in as admin...");
  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });

  if (!adminLogin.ok) {
    console.error("❌ Admin login failed");
    return;
  }

  console.log("✅ Admin login successful");

  // Create a new faculty user
  const newFaculty = {
    username: "test.faculty",
    password: "testpass123",
    email: "test.faculty@university.edu",
    role: "faculty"
  };

  console.log(`\n👤 Creating faculty user: ${newFaculty.username}`);

  const createUserResponse = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(newFaculty),
  });

  if (createUserResponse.ok) {
    console.log("✅ User creation successful");
    const userData = await createUserResponse.json();
    console.log("Created user:", userData.user);
  } else {
    const error = await createUserResponse.json();
    console.error("❌ User creation failed:", error.message);
    return;
  }

  // Logout admin
  await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  // Now try to login with the new faculty credentials
  console.log(`\n🔐 Testing login with new faculty credentials: ${newFaculty.username} / ${newFaculty.password}`);

  const facultyLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      username: newFaculty.username,
      password: newFaculty.password
    }),
  });

  if (facultyLogin.ok) {
    const loginData = await facultyLogin.json();
    console.log("✅ Faculty login successful!");
    console.log("User data:", {
      id: loginData.user._id,
      username: loginData.user.username,
      role: loginData.user.role,
      email: loginData.user.email
    });
  } else {
    const error = await facultyLogin.json();
    console.error("❌ Faculty login failed:", error.message);
  }
}

testUserCreationAndLogin().catch(console.error);