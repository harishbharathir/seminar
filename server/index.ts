import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';
import { connectDB } from './db';
import { User, Hall, Booking } from './models';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return done(null, false, { message: 'Invalid password' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// --- SOCKET.IO LOGIC ---
io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected'));
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role, name, email, department } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'faculty',
      name,
      email,
      department,
      createdAt: new Date().toISOString()
    }) as any;
    res.status(201).json({ message: "User registered", user: { id: newUser.id, username, role: newUser.role, name, email, department } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res, next) => {
  console.log('--- POST /api/auth/login ---');
  console.log('Username:', req.body.username);
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      console.error('Passport authenticate error:', err);
      return next(err);
    }
    if (!user) {
      console.log('Login failed:', info?.message);
      return res.status(401).json({ message: info?.message || 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('req.logIn error:', err);
        return next(err);
      }
      console.log('Login successful. SessionID:', req.sessionID);
      res.json({ message: "Logged in", user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, department: user.department } });
    });
  })(req, res, next);
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

// --- HALLS ROUTES ---
app.get('/api/halls', async (req, res) => {
  try {
    const hallsList = await Hall.find();
    res.json(hallsList);
  } catch (err) {
    console.error('Fetch halls error:', err);
    res.status(500).json({ error: 'Failed to fetch halls' });
  }
});

app.post('/api/halls', async (req, res) => {
  try {
    const hall = await Hall.create({
      ...req.body,
      createdAt: new Date().toISOString()
    });
    io.emit('hall:created', hall);
    res.status(201).json(hall);
  } catch (err) {
    console.error('Create hall error:', err);
    res.status(500).json({ error: 'Failed to create hall' });
  }
});

// --- BOOKINGS ROUTES ---
app.get('/api/bookings', async (req, res) => {
  try {
    const bookingsList = await Booking.find();
    res.json(bookingsList);
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  console.log('--- POST /api/bookings ---');
  console.log('SessionID:', req.sessionID);
  console.log('Cookies:', req.headers.cookie);
  console.log('Authenticated:', req.isAuthenticated());
  console.log('User:', req.user ? (req.user as any).username : 'undefined');

  try {
    if (!req.isAuthenticated()) {
      console.log('Unauthorized booking attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = req.user as any;
    const bookingData = {
      ...req.body,
      userId: user.id || user._id,
      facultyName: user.name || user.username,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    console.log('Creating booking with data:', JSON.stringify(bookingData, null, 2));

    const booking = await Booking.create(bookingData);
    io.emit('booking:created', booking);
    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error details:', err);
    res.status(500).json({ error: 'Failed to create booking', details: err instanceof Error ? err.message : String(err) });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (booking) {
      io.emit('booking:updated', booking);
      res.json(booking);
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (booking) {
      io.emit('booking:cancelled', booking);
      res.json({ message: "Booking cancelled" });
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// --- USERS ROUTES (Admin only) ---
app.get('/api/users', async (req, res) => {
  try {
    const usersList = await User.find({}, '-password');
    res.json(usersList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role, email, name, department } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'faculty',
      email,
      name,
      department,
      createdAt: new Date().toISOString()
    }) as any;
    const userResponse = newUser.toJSON();
    delete (userResponse as any).password;
    res.status(201).json(userResponse);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (user) {
      res.json({ message: "User deleted" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// --- SERVE FRONTEND (Production) ---
if (process.env.NODE_ENV === 'production') {
  const publicPath = join(__dirname, 'public');
  app.use(express.static(publicPath));

  // Catch-all route for SPA
  app.get('/*path', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(join(publicPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server & Socket.io running on port ${PORT}`);
});
