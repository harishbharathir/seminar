# Vercel Deployment Guide for Hall Scheduler

## Project Structure Analysis

```
Hall-Scheduler/
├── client/              # React frontend (Vite)
│   ├── src/            # React components & pages
│   └── public/         # Static assets
├── server/             # Express.js backend
│   ├── index.ts        # Main server entry
│   ├── routes.ts       # API routes
│   └── storage.ts      # MongoDB operations
├── shared/             # Shared types & schemas
├── api/                # Vercel serverless functions
│   └── index.js        # Serverless entry point
├── dist/               # Build output (generated)
│   ├── public/         # Built frontend
│   └── index.mjs       # Built backend
└── vercel.json         # Vercel configuration
```

## Prerequisites

1. ✅ MongoDB Atlas database (already configured)
2. ✅ GitHub account
3. ✅ Vercel account (free tier works)

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Prepare for Vercel deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/hall-scheduler.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? hall-scheduler (or your choice)
# - Directory? ./ (current directory)
# - Override settings? No

# Deploy to production
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

### 3. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
MONGODB_URI=mongodb+srv://mfmfahy_db_user:Bfkcd18ynkmWfqGi@cluster0.vtblf9g.mongodb.net/?appName=Cluster0
SESSION_SECRET=your-production-secret-key-change-this
NODE_ENV=production
```

**Important**: Generate a strong SESSION_SECRET for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Seed the Database (One-time)

After deployment, seed your database with initial data:

```bash
# Run locally with production MongoDB
npm run seed
```

Or create a temporary Vercel function to seed (remove after use).

### 5. Verify Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test login with:
   - **Admin**: username: `admin`, password: `admin123`
   - **Faculty**: username: `faheem`, password: `123`

## Important Notes

### ⚠️ Limitations on Vercel

1. **Socket.IO**: Real-time features (Socket.IO) won't work on Vercel serverless
   - Bookings will still work but without live updates
   - Consider using Vercel's Edge Functions or deploy to Railway/Render for Socket.IO

2. **Session Storage**: Using MemoryStore (sessions reset on each deployment)
   - For production, use Redis or MongoDB session store

### 🔧 Recommended Improvements for Production

1. **Use MongoDB Session Store**:
```bash
npm install connect-mongodb-session
```

Update `server/index.ts`:
```javascript
import MongoDBStore from 'connect-mongodb-session';
const MongoDBStoreSession = MongoDBStore(session);

app.use(session({
  secret: process.env.SESSION_SECRET,
  store: new MongoDBStoreSession({
    uri: process.env.MONGODB_URI,
    collection: 'sessions'
  }),
  // ... other options
}));
```

2. **Hash Passwords**: Currently passwords are stored in plain text
   - Use bcrypt for password hashing

3. **HTTPS Cookies**: Update session config:
```javascript
cookie: { 
  secure: true,  // Require HTTPS
  httpOnly: true,
  sameSite: 'strict'
}
```

## Alternative Hosting (For Socket.IO Support)

If you need real-time features, consider:

### Railway.app
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render.com
1. Connect GitHub repository
2. Select "Web Service"
3. Build Command: `npm run build`
4. Start Command: `npm start`

## Troubleshooting

### Build Fails
- Check Node.js version (use Node 18+)
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Check environment variables are set correctly
- Test connection string locally first

### 404 Errors
- Ensure `vercel.json` rewrites are configured
- Check `dist/index.mjs` is generated during build
- Verify API routes start with `/api/`

### Session Issues
- Sessions reset on each deployment (use MongoDB session store)
- Check SESSION_SECRET is set in environment variables

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database seeded with initial data
- [ ] Admin login works
- [ ] Faculty login works
- [ ] Hall creation works (admin)
- [ ] Booking creation works (faculty)
- [ ] Booking cancellation works (any faculty)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic on Vercel)

## Monitoring & Logs

- View logs: Vercel Dashboard → Your Project → Deployments → View Function Logs
- Monitor performance: Vercel Analytics (enable in project settings)
- Error tracking: Consider Sentry integration

## Support

For issues:
1. Check Vercel deployment logs
2. Test locally with `npm run build && npm start`
3. Verify MongoDB connection
4. Check browser console for frontend errors

## Quick Commands Reference

```bash
# Local development
npm run dev

# Build for production
npm run build

# Start production server locally
npm start

# Deploy to Vercel
vercel --prod

# View logs
vercel logs

# Seed database
npm run seed
```

---

**Your project is now ready for Vercel deployment! 🚀**
