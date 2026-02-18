import { z } from "zod";

// TypeScript types for MongoDB documents
export interface User {
  _id: string;
  username: string;
  password: string;
  role: "admin" | "faculty";
  email?: string;
  createdAt: string;
}

export interface Hall {
  _id: string;
  name: string;
  capacity: string;
  location?: string;
  amenities?: string;
  createdBy: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  hallId: string;
  userId: string;
  bookingReason?: string;
  bookingDate: string;
  period: number; // 1-8 representing the time period
  status: "pending" | "accepted" | "booked" | "rejected" | "cancelled";
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
}

// Zod schemas for form validation
export const insertUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["admin", "faculty"]).optional(),
  email: z.string().email().optional(),
});

export const insertHallSchema = z.object({
  name: z.string().min(1),
  capacity: z.string().or(z.number()).transform(String),
  location: z.string().optional(),
  amenities: z.string().optional(),
  createdBy: z.string(),
});

export const insertBookingSchema = z.object({
  hallId: z.string(),
  userId: z.string(),
  bookingReason: z.string().optional(),
  bookingDate: z.string(),
  period: z.number().min(1).max(8),
  rejectionReason: z.string().optional(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHall = z.infer<typeof insertHallSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
