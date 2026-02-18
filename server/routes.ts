import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertHallSchema, insertBookingSchema } from "@shared/schema";
import XLSX from "xlsx";
import { io } from "./index";

// Middleware to check if user is admin
function requireAdmin(req: Request, res: Response, next: Function) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Middleware to check if user is authenticated
function requireAuth(req: Request, res: Response, next: Function) {
  const user = (req as any).session?.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  (req as any).user = user;
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============== AUTHENTICATION ROUTES ==============
  
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, role } = req.body;
      
      // Check if user exists
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        username,
        password, // In production, hash this!
        role: role || "faculty",
      });

      // Store user in session immediately after creation
      (req as any).session.user = user;
      (req as any).session.save((err: any) => {
        if (err) console.error("Session save error:", err);
      });

      return res.status(201).json({ message: "User created", user });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      console.log("Login attempt for username:", username);
      
      const user = await storage.getUserByUsername(username);
      console.log("User found:", user ? { id: user._id, username: user.username, role: user.role } : "null");

      if (!user) {
        console.log("User not found");
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.password !== password) {
        console.log("Password mismatch. Expected:", user.password, "Got:", password);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("Login successful for user:", user.username);

      // Store user in session and save explicitly
      (req as any).session.user = user;
      (req as any).session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        return res.json({ message: "Logged in", user });
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  // ============== USER MANAGEMENT ROUTES ==============

  app.get("/api/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // For now, we'll return a simple list. In production, you'd want pagination
      const users = await storage.getUsers();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { username, password, role, email } = req.body;
      console.log("Creating user:", { username, role, email });
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check if user exists
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        console.log("User already exists:", username);
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        username,
        password, // In production, hash this!
        role: role || "faculty",
        email,
      });

      console.log("User created successfully:", { id: user._id, username: user.username, role: user.role });
      return res.status(201).json({ message: "User created", user });
    } catch (error) {
      console.error("User creation error:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ message: "User deleted" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============== HALLS ROUTES ==============

  app.get("/api/halls", async (req: Request, res: Response) => {
    try {
      const halls = await storage.getHalls();
      return res.json(halls);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch halls" });
    }
  });

  app.get("/api/halls/:id", async (req: Request, res: Response) => {
    try {
      const hall = await storage.getHall(req.params.id as string);
      if (!hall) {
        return res.status(404).json({ message: "Hall not found" });
      }
      return res.json(hall);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch hall" });
    }
  });

  app.post("/api/halls", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validated = insertHallSchema.parse({
        ...req.body,
        createdBy: (req as any).user._id,
      });

      const hall = await storage.createHall(validated);
      
      // Emit socket event for real-time update
      io.emit("hall:created", hall);
      
      return res.status(201).json(hall);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Failed to create hall" });
    }
  });

  app.delete("/api/halls/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteHall(req.params.id as string);
      if (!success) {
        return res.status(404).json({ message: "Hall not found" });
      }
      return res.json({ message: "Hall deleted" });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete hall" });
    }
  });

  // ============== BOOKINGS ROUTES ==============

  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const filters = {
        hallId: req.query.hallId as string,
        userId: req.query.userId as string,
        status: req.query.status as string,
      };

      const bookings = await storage.getBookings(filters);
      return res.json(bookings);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.id as string);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      return res.json(booking);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req: Request, res: Response) => {
    try {
      const validated = insertBookingSchema.parse({
        ...req.body,
        userId: (req as any).user._id,
      });

      // Check for conflicts (first-come-first-served)
      const conflict = await storage.checkBookingConflict(
        validated.hallId,
        validated.bookingDate,
        validated.period
      );

      if (conflict) {
        return res.status(409).json({ 
          message: "This time slot is already booked for this hall",
          conflictingBookingId: conflict._id 
        });
      }

      const booking = await storage.createBooking(validated);
      
      // Emit socket event for real-time update
      io.emit("booking:created", booking);
      
      return res.status(201).json(booking);
    } catch (error: any) {
      return res.status(400).json({ message: error.message || "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const { status, rejectionReason } = req.body;
      
      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        pending: ["accepted", "rejected", "cancelled"],
        accepted: ["booked", "rejected", "cancelled"],
        booked: ["cancelled"],
        rejected: [],
        cancelled: []
      };

      if (!validTransitions[booking.status]?.includes(status)) {
        return res.status(400).json({ 
          message: `Cannot transition from ${booking.status} to ${status}` 
        });
      }

      // If rejecting, require a reason
      if (status === "rejected" && !rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const updates: any = { status };
      if (status === "rejected") {
        updates.rejectionReason = rejectionReason;
      }

      const updatedBooking = await storage.updateBooking(req.params.id, updates);
      
      // Emit socket event for real-time update
      io.emit("booking:updated", updatedBooking);
      
      return res.json(updatedBooking);
    } catch (error) {
      return res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.id as string);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const user = (req as any).user;
      
      // Allow cancellation by:
      // 1. The user who created the booking
      // 2. Any admin
      // 3. Any faculty member (can cancel other faculty bookings)
      if (booking.userId !== user._id && user.role !== "admin" && user.role !== "faculty") {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Update status to cancelled instead of deleting
      const cancelledBooking = await storage.updateBooking(req.params.id, {
        status: "cancelled"
      });

      // Emit socket event for real-time update
      if (cancelledBooking) {
        io.emit("booking:cancelled", cancelledBooking);
      }

      return res.json({ message: "Booking cancelled", booking: cancelledBooking });
    } catch (error) {
      return res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ============== EXCEL EXPORT ROUTE ==============

  app.get("/api/bookings/export/excel", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      const halls = await storage.getHalls();
      
      // Create mapping of hall IDs to names
      const hallMap = new Map(halls.map((h) => [h._id, h]));

      // Prepare data for Excel
      const data = bookings.map((booking) => {
        const hall = hallMap.get(booking.hallId);
        const periods = [
          "9:50-10:00", "10:00-10:45", "11:00-11:50", "11:50-12:45",
          "1:25-2:20", "2:20-3:05", "3:10-4:00", "4:00-4:50"
        ];
        return {
          "Booking ID": booking._id,
          "Hall Name": hall?.name || "N/A",
          "Hall Location": hall?.location || "N/A",
          "Booking Reason": booking.bookingReason || "N/A",
          "Booking Date": booking.bookingDate,
          "Period": periods[booking.period - 1],
          "Status": booking.status,
          "Rejection Reason": booking.rejectionReason || "N/A",
          "Created At": booking.createdAt,
          "Updated At": booking.updatedAt || "N/A",
        };
      });

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

      // Set column widths
      worksheet["!cols"] = [
        { wch: 20 }, // Booking ID
        { wch: 20 }, // Hall Name
        { wch: 20 }, // Hall Location
        { wch: 20 }, // Faculty Name
        { wch: 15 }, // Booking Date
        { wch: 15 }, // Period
        { wch: 15 }, // Status
        { wch: 30 }, // Rejection Reason
        { wch: 20 }, // Created At
        { wch: 20 }, // Updated At
      ];

      // Generate buffer
      const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      // Send file
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="bookings-${new Date().toISOString().split("T")[0]}.xlsx"`);
      
      return res.send(buffer);
    } catch (error) {
      console.error("Excel export error:", error);
      return res.status(500).json({ message: "Failed to export Excel" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      return res.json({ message: "Logged out" });
    });
  });

  // ============== SOCKET.IO SETUP ==============
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return httpServer;
}
