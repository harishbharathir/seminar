import { connectDB } from './server/db';
import { Booking } from './server/models';
import mongoose from 'mongoose';

async function test() {
    try {
        console.log("Connecting to DB...");
        await connectDB();
        console.log("Fetching bookings...");
        const bookings = await Booking.find();
        console.log("Found bookings:", bookings.length);
        console.log("JSON:", JSON.stringify(bookings, null, 2));
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

test();
