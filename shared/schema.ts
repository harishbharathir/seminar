import { mongodbTable, text, int, timestamp, objectId } from "drizzle-orm/mongodb-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mongodbTable("users", {
    id: objectId("id").primaryKey(),
    username: text("username").notNull(),
    password: text("password").notNull(),
    role: text("role").$type<"admin" | "faculty">().default("faculty"),
    email: text("email"),
    createdAt: timestamp("createdAt").defaultNow(),
});

export const halls = mongodbTable("halls", {
    id: objectId("id").primaryKey(),
    name: text("name").notNull(),
    capacity: text("capacity").notNull(),
    location: text("location"),
    amenities: text("amenities"),
    createdAt: timestamp("createdAt").defaultNow(),
});

export const bookings = mongodbTable("bookings", {
    id: objectId("id").primaryKey(),
    hallId: text("hallId").notNull(),
    userId: text("userId").notNull(),
    facultyName: text("facultyName"),
    bookingReason: text("bookingReason").notNull(),
    bookingDate: text("bookingDate").notNull(),
    period: int("period").notNull(),
    status: text("status").$type<"pending" | "accepted" | "booked" | "rejected" | "cancelled">().default("pending"),
    rejectionReason: text("rejectionReason"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt"),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertHallSchema = createInsertSchema(halls);
export const selectHallSchema = createSelectSchema(halls);
export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Hall = typeof halls.$inferSelect;
export type NewHall = typeof halls.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
