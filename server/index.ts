import cors from 'cors';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
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
    origin: process.env.NODE_ENV === 'production'
      ? "https://seminar-zwim.onrender.com"
      : "http://localhost:3000",
    credentials: true
  }
});

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic CORS based on environment
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://seminar-zwim.onrender.com'
    : 'http://localhost:3000',
  credentials: true
}));

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true if on HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- PASSPORT STRATEGY ---
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

// --- API ROUTES ---
// (Define these BEFORE serving static files/wildcards)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, role, name, email, department } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role: role || 'faculty',
      name, email, department,
      createdAt: new Date().toISOString()
    }) as any;
    res.status(201).json({ message: "User registered", user: { id: newUser.id, username, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res, next) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Login failed' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.json({ message: "Logged in", user: { id: user.id, username: user.username, role: user.role } });
    });
  })(req, res, next);
});

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/halls', async (req, res) => {
  const hallsList = await Hall.find();
  res.json(hallsList);
});

app.post('/api/bookings', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const user = req.user as any;
    const booking = await Booking.create({
      ...req.body,
      userId: user.id,
      facultyName: user.name || user.username,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    io.emit('booking:created', booking);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed' });
  }
});

// --- STATIC ASSETS & SPA ROUTING ---
// Resolve the path to client/dist relative to the root of your project
const clientDistPath = resolve(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// The "Catch-all" route for Single Page Applications
// This MUST be the very last route in your file.
app.get('/*path', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(join(clientDistPath, 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
