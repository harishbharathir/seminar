import { MongoClient, Db, ObjectId } from "mongodb";
import {
  type User,
  type InsertUser,
  type Hall,
  type InsertHall,
  type Booking,
  type InsertBooking,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Fallback in-memory storage for development when MongoDB is not available
class MemStorage implements IStorage {
  private users: Map<string, User>;
  private halls: Map<string, Hall>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.halls = new Map();
    this.bookings = new Map();
    
    // Add some default halls for development
    this.createDefaultHalls();
  }

  private createDefaultHalls() {
    const defaultHalls = [
      {
        _id: "5cb90bba-3dd6-4345-9911-61986e774332",
        name: "Main Auditorium",
        capacity: "500",
        location: "Building A",
        amenities: "Projector, Sound System",
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "6dd5bd71-2eb9-453f-bec9-097baeadd677",
        name: "Conference Room A",
        capacity: "50",
        location: "Building B",
        amenities: "Whiteboard, Video Conferencing",
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
      {
        _id: "7ee6ce82-4efa-5450-adca-198cbfbdd788",
        name: "Lecture Hall 1",
        capacity: "200",
        location: "Building C",
        amenities: "Projector, Microphone",
        createdBy: "admin",
        createdAt: new Date().toISOString(),
      },
    ];

    defaultHalls.forEach(hall => {
      this.halls.set(hall._id, hall);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      _id: id,
      createdAt: new Date().toISOString(),
      role: insertUser.role || "faculty",
    };
    this.users.set(id, user);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getHalls(): Promise<Hall[]> {
    return Array.from(this.halls.values());
  }

  async getHall(id: string): Promise<Hall | undefined> {
    return this.halls.get(id);
  }

  async createHall(insertHall: InsertHall): Promise<Hall> {
    const id = randomUUID();
    const hall: Hall = {
      ...insertHall,
      _id: id,
      createdAt: new Date().toISOString(),
    };
    this.halls.set(id, hall);
    return hall;
  }

  async deleteHall(id: string): Promise<boolean> {
    return this.halls.delete(id);
  }

  async getBookings(filters?: {
    hallId?: string;
    userId?: string;
    status?: string;
  }): Promise<Booking[]> {
    let bookings = Array.from(this.bookings.values());

    if (filters?.hallId) {
      bookings = bookings.filter((b) => b.hallId === filters.hallId);
    }
    if (filters?.userId) {
      bookings = bookings.filter((b) => b.userId === filters.userId);
    }
    if (filters?.status) {
      bookings = bookings.filter((b) => b.status === filters.status);
    }

    return bookings;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      _id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: insertBooking.status || "pending",
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updated: Booking = {
      ...booking,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async checkBookingConflict(hallId: string, bookingDate: string, period: number): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(
      (b) => b.hallId === hallId && b.bookingDate === bookingDate && b.period === period && 
             (b.status === "accepted" || b.status === "booked")
    );
  }
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  deleteUser(id: string): Promise<boolean>;

  // Hall operations
  getHalls(): Promise<Hall[]>;
  getHall(id: string): Promise<Hall | undefined>;
  createHall(hall: InsertHall): Promise<Hall>;
  deleteHall(id: string): Promise<boolean>;

  // Booking operations
  getBookings(filters?: {
    hallId?: string;
    userId?: string;
    status?: string;
  }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  checkBookingConflict(hallId: string, bookingDate: string, period: number): Promise<Booking | undefined>;
}

class MongoStorage implements IStorage {
  private db: Db;
  private usersCollection: any;
  private hallsCollection: any;
  private bookingsCollection: any;

  constructor(db: Db) {
    this.db = db;
    this.usersCollection = db.collection("users");
    this.hallsCollection = db.collection("halls");
    this.bookingsCollection = db.collection("bookings");
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.usersCollection.findOne({ _id: id });
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log("MongoDB: Looking for user:", username);
      const user = await this.usersCollection.findOne({ username });
      console.log("MongoDB: User found:", user ? "yes" : "no");
      return user || undefined;
    } catch (error) {
      console.error("MongoDB: Error finding user:", error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    const users = await this.usersCollection.find({}).toArray();
    return users;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = randomUUID();
      const user: User = {
        ...insertUser,
        _id: id,
        createdAt: new Date().toISOString(),
        role: insertUser.role || "faculty",
      };
      console.log("MongoDB: Creating user:", { username: user.username, role: user.role });
      await this.usersCollection.insertOne(user);
      console.log("MongoDB: User created successfully");
      return user;
    } catch (error) {
      console.error("MongoDB: Error creating user:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.usersCollection.deleteOne({ _id: id });
    return (result.deletedCount ?? 0) > 0;
  }

  async getHalls(): Promise<Hall[]> {
    try {
      console.log("Fetching halls from MongoDB...");
      const halls = await this.hallsCollection.find({}).toArray();
      console.log(`Found ${halls.length} halls`);
      return halls;
    } catch (error) {
      console.error("Error fetching halls:", error);
      throw error;
    }
  }

  async getHall(id: string): Promise<Hall | undefined> {
    const hall = await this.hallsCollection.findOne({ _id: id });
    return hall || undefined;
  }

  async createHall(insertHall: InsertHall): Promise<Hall> {
    const id = randomUUID();
    const hall: Hall = {
      ...insertHall,
      _id: id,
      createdAt: new Date().toISOString(),
    };
    await this.hallsCollection.insertOne(hall);
    return hall;
  }

  async deleteHall(id: string): Promise<boolean> {
    const result = await this.hallsCollection.deleteOne({ _id: id });
    return (result.deletedCount ?? 0) > 0;
  }

  async getBookings(filters?: {
    hallId?: string;
    userId?: string;
    status?: string;
  }): Promise<Booking[]> {
    const query: any = {};
    if (filters?.hallId) query.hallId = filters.hallId;
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.status) query.status = filters.status;

    const bookings = await this.bookingsCollection.find(query).toArray();
    return bookings;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const booking = await this.bookingsCollection.findOne({ _id: id });
    return booking || undefined;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      _id: id,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.bookingsCollection.insertOne(booking);
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const result = await this.bookingsCollection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );
    return result.value || undefined;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const result = await this.bookingsCollection.deleteOne({ _id: id });
    return (result.deletedCount ?? 0) > 0;
  }

  async checkBookingConflict(hallId: string, bookingDate: string, period: number): Promise<Booking | undefined> {
    const booking = await this.bookingsCollection.findOne({
      hallId,
      bookingDate,
      period,
      status: { $in: ["accepted", "booked"] }
    });
    return booking || undefined;
  }
}

let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  console.log("MONGODB_URI:", process.env.MONGODB_URI);
  if (process.env.MONGODB_URI) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db("hall_scheduler");
      console.log("✓ Connected to MongoDB");
      return new MongoStorage(db);
    } catch (error) {
      console.warn(
        "⚠ Failed to connect to MongoDB, using in-memory storage:",
        (error as Error).message,
      );
      return new MemStorage();
    }
  } else {
    console.warn("⚠ MONGODB_URI not set, using in-memory storage");
    return new MemStorage();
  }
}

storage = await initializeStorage();

export { storage };
