# 🚀 Deployment Guide

This document provides setup instructions for deploying Xeno CRM on Vercel (Frontend) and Render (Backend).

## Architecture Overview

```
┌─────────────────────────┐
│  Frontend (Vercel)      │
│  Next.js Application    │
└────────────┬────────────┘
             │ HTTPS
             │
┌────────────▼────────────┐
│  Backend (Render)       │
│  Express.js + Node.js   │
│  - API Routes           │
│  - Channel Service      │
│  - Job Queues (BullMQ)  │
└─────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼──────┐   ┌──────▼─────┐
│ Database │   │ Redis Queue │
│ (Neon)   │   │ (Upstash)   │
└──────────┘   └─────────────┘
```

---

## Backend Deployment (Render)

### Prerequisites
- Render account: https://render.com
- GitHub repository with the code
- Environment variables ready

### Step 1: Create a PostgreSQL Database on Neon

1. Go to [Neon](https://neon.tech)
2. Sign up or log in
3. Create a new project
4. Copy the PostgreSQL connection string (includes DATABASE_URL)
5. Save it for later

### Step 2: Create a Redis Instance on Upstash

1. Go to [Upstash](https://upstash.com)
2. Sign up or log in
3. Create a new Redis database
4. Copy the REDIS_URL (with password)
5. Save it for later

### Step 3: Create a Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `xeno-crm-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Choose appropriate tier (Starter is free, but limited)

### Step 4: Add Environment Variables

In Render dashboard, go to the service settings → Environment:

```
PORT=3001
NODE_ENV=production
BACKEND_URL=https://<your-render-app>.onrender.com
FRONTEND_URL=https://<your-vercel-app>.vercel.app
DATABASE_URL=postgresql://user:password@...
REDIS_URL=redis://:password@...
GROQ_API_KEY=gsk_your_key_here
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
JWT_SECRET=your_super_secret_key_change_this
GOOGLE_CLIENT_ID=your_google_client_id
```

### Step 5: Deploy

- Push to GitHub
- Render will automatically build and deploy
- Check build logs for errors

---

## Frontend Deployment (Vercel)

### Prerequisites
- Vercel account: https://vercel.com
- GitHub repository with the code
- Backend URL from Render

### Step 1: Create a Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the `frontend` folder as the root directory

### Step 2: Configure Build Settings

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://<your-render-app>.onrender.com/api
```

### Step 4: Deploy

- Click "Deploy"
- Vercel will build and deploy automatically
- Your app will be available at `https://your-app.vercel.app`

---

## Channel Service Integration

The channel service has been **merged into the backend**. No separate deployment needed!

### Key Points:
- Channel simulator is now part of the backend (`src/lib/channel/simulator.ts`)
- Routes available at: `https://<backend>/api/channel/send`
- Health check: `https://<backend>/api/channel/health`
- The job queue worker automatically uses the simulator

---

## Database Setup

### 1. Run Initial Migrations

After deploying to Render, run migrations:

```bash
# SSH into Render service or use build environment
npm run db:push
```

Or trigger via Render's shell access:

1. Go to your Render service
2. Click "Connect"
3. Run: `npm run db:push`

### 2. Optional: Seed Initial Data

```bash
npm run db:seed
```

---

## Health Checks & Monitoring

### Backend Health
```bash
curl https://<your-render-app>.onrender.com/health
```

Response:
```json
{
  "status": "ok",
  "service": "xeno-crm",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Channel Service Health
```bash
curl https://<your-render-app>.onrender.com/api/channel/health
```

### Check Logs

**Render Backend Logs:**
- Dashboard → Service → Logs tab

**Vercel Frontend Logs:**
- Dashboard → Project → Deployments → Logs

---

## Environment Variables Reference

### Backend (.env)
| Variable | Example | Note |
|----------|---------|------|
| `BACKEND_URL` | `https://app.onrender.com` | Must match Render URL |
| `FRONTEND_URL` | `https://app.vercel.app` | For CORS configuration |
| `DATABASE_URL` | From Neon | PostgreSQL connection |
| `REDIS_URL` | From Upstash | Redis connection with password |
| `GROQ_API_KEY` | `gsk_...` | Get from Groq API |
| `JWT_SECRET` | Complex string | Keep it secret! |

### Frontend (.env.local)
| Variable | Example | Note |
|----------|---------|------|
| `NEXT_PUBLIC_API_URL` | `https://app.onrender.com/api` | Must be public (accessible from browser) |

---

## Troubleshooting

### Backend won't start on Render
1. Check build logs in Render dashboard
2. Verify DATABASE_URL and REDIS_URL are correct
3. Ensure all dependencies are installed
4. Check TypeScript compilation errors

### Frontend can't connect to backend
1. Verify `NEXT_PUBLIC_API_URL` is correct and accessible
2. Check CORS settings in backend (`frontend_url` must be in FRONTEND_URL env var)
3. Check browser console for network errors

### Database migrations fail
1. SSH into Render service
2. Run: `npm run db:push --force-reset` (⚠️ WARNING: This will delete data)
3. Or manually run migrations in Neon dashboard

---

## Cost Estimates

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Vercel | Pro | $20/mo | Includes deployments, analytics |
| Render | Starter | Free | Limited resources, recommended for dev/testing |
| Render | Standard | $7/mo | Good for production |
| Neon | Free | Free | 5 projects, 3 GB storage |
| Upstash | Pro | Free tier available | $0.25 per 100k commands |

---

## Next Steps

1. ✅ Deploy backend on Render
2. ✅ Deploy frontend on Vercel
3. ✅ Run database migrations
4. ✅ Test API connectivity
5. ✅ Set up monitoring/alerts
6. 🔄 Enable auto-deployments on git push
7. 📊 Configure analytics and logging

---

## Support & Documentation

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Upstash Docs](https://upstash.com/docs)
