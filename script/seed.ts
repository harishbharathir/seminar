import "dotenv/config";
import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";

async function seedDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db("hall_scheduler");

    console.log("Connected to MongoDB");

    // Clear existing users
    await db.collection("users").deleteMany({});
    console.log("Cleared existing users");

    // Create admin user
    const adminUser = {
      _id: randomUUID(),
      username: "admin",
      password: "admin123", // In production, this should be hashed
      role: "admin",
      email: "admin@university.edu",
      createdAt: new Date().toISOString(),
    };

    // Create faculty users
    const facultyUsers = [
      {
        _id: randomUUID(),
        username: "john.doe",
        password: "faculty123",
        role: "faculty",
        email: "john.doe@university.edu",
        createdAt: new Date().toISOString(),
      },
      {
        _id: randomUUID(),
        username: "jane.smith",
        password: "faculty456",
        role: "faculty",
        email: "jane.smith@university.edu",
        createdAt: new Date().toISOString(),
      },
      {
        _id: randomUUID(),
        username: "prof.wilson",
        password: "faculty789",
        role: "faculty",
        email: "prof.wilson@university.edu",
        createdAt: new Date().toISOString(),
      },
      {
        _id: randomUUID(),
        username: "faheem",
        password: "123",
        role: "faculty",
        email: "faheem@university.edu",
        createdAt: new Date().toISOString(),
      },
    ];

    // Insert users
    await db.collection("users").insertOne(adminUser);
    await db.collection("users").insertMany(facultyUsers);

    console.log("✅ Database seeded successfully!");
    console.log("\n📋 Created Users:");
    console.log("==================");
    console.log(`Admin: ${adminUser.username} / ${adminUser.password}`);
    console.log("Faculty Users:");
    facultyUsers.forEach(user => {
      console.log(`  - ${user.username} / ${user.password} (${user.email})`);
    });

    console.log("\n🔐 Use these credentials to login:");
    console.log("- Admin: admin / admin123");
    console.log("- Faculty: john.doe / faculty123");
    console.log("- Faculty: jane.smith / faculty456");
    console.log("- Faculty: prof.wilson / faculty789");
    console.log("- Faculty: faheem / 123");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

seedDatabase().catch(console.error);