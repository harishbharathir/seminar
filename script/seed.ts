import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../server/models';
import { connectDB } from '../server/db';

async function seed() {
    console.log("Seeding database...");
    try {
        await connectDB();

        const admin = await User.findOne({ username: "admin" });

        if (!admin) {
            console.log("Creating default admin account...");
            const hashedPassword = await bcrypt.hash("password", 10);
            await User.create({
                username: "admin",
                password: hashedPassword,
                role: "admin",
            });
            console.log("Admin account created: admin / password");
        } else {
            console.log("Admin account already exists.");
        }
    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

seed();
