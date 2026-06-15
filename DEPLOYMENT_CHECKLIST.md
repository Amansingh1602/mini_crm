# 🚀 Quick Deployment Checklist

## Pre-Deployment Setup

### 1. Backend (Render) Setup
- [ ] Create Neon PostgreSQL database
  - Copy `DATABASE_URL`
- [ ] Create Upstash Redis instance
  - Copy `REDIS_URL`
- [ ] Get GROQ API key from [groq.com](https://groq.com)

### 2. Environment Variables Ready
- [ ] `BACKEND_URL` - Your Render app URL
- [ ] `FRONTEND_URL` - Your Vercel app URL
- [ ] `DATABASE_URL` - From Neon
- [ ] `REDIS_URL` - From Upstash
- [ ] `GROQ_API_KEY` - From Groq
- [ ] `JWT_SECRET` - Generate a strong random string
- [ ] `GOOGLE_CLIENT_ID` - (Optional) From Google Cloud Console

---

## Backend Deployment (Render)

### Quick Steps

1. **Connect GitHub to Render**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Select your GitHub repository

2. **Configure Service**
   ```
   Name: xeno-crm-backend
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Add Environment Variables** (in Render dashboard)
   ```
   NODE_ENV=production
   PORT=3001
   BACKEND_URL=https://{service-name}.onrender.com
   FRONTEND_URL=https://{your-vercel-app}.vercel.app
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://:password@...
   GROQ_API_KEY=gsk_...
   JWT_SECRET={strong-random-string}
   GOOGLE_CLIENT_ID={optional}
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Check logs for errors

5. **Post-Deployment**
   ```bash
   # Via Render Shell:
   npm run db:push
   # (Optional) npm run db:seed
   ```

### Test Backend
```bash
curl https://{service-name}.onrender.com/health
```

---

## Frontend Deployment (Vercel)

### Quick Steps

1. **Create Vercel Project**
   - Go to https://vercel.com/dashboard
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select `frontend` as root directory (if monorepo)

2. **Configure Build**
   ```
   Framework: Next.js
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Add Environment Variables** (in Vercel dashboard)
   ```
   NEXT_PUBLIC_API_URL=https://{render-app}.onrender.com/api
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your URL: `https://{project-name}.vercel.app`

### Test Frontend
```bash
# Open in browser
https://{project-name}.vercel.app
```

---

## Verification Checklist

### Backend Verification
- [ ] Health check returns 200: `GET /health`
- [ ] API accessible from frontend origin
- [ ] Database connected (check logs)
- [ ] Redis connected (check logs)
- [ ] CORS headers allow frontend URL

### Frontend Verification
- [ ] Page loads without errors
- [ ] API calls succeed (check Network tab)
- [ ] Login/authentication works
- [ ] WebSocket connection established (check console)

### API Connectivity
- [ ] Frontend can reach backend API
- [ ] CORS errors resolved
- [ ] Authentication tokens work
- [ ] Real-time updates via WebSocket

---

## Environment Variables Summary

### Backend
| Variable | Source | Example |
|----------|--------|---------|
| `BACKEND_URL` | Render URL | `https://xeno-backend.onrender.com` |
| `FRONTEND_URL` | Vercel URL | `https://xeno-frontend.vercel.app` |
| `DATABASE_URL` | Neon | `postgresql://user:pwd@...` |
| `REDIS_URL` | Upstash | `redis://:pwd@...` |
| `GROQ_API_KEY` | Groq Console | `gsk_...` |
| `JWT_SECRET` | Generate | `openssl rand -base64 32` |

### Frontend
| Variable | Value | Example |
|----------|-------|---------|
| `NEXT_PUBLIC_API_URL` | Backend URL + `/api` | `https://xeno-backend.onrender.com/api` |

---

## Common Issues & Fixes

### "Cannot connect to database"
- ✅ Verify `DATABASE_URL` in Render environment variables
- ✅ Check Neon database is running
- ✅ Ensure database URL format is correct

### "Redis connection failed"
- ✅ Verify `REDIS_URL` in Render environment variables
- ✅ Check Upstash database is running
- ✅ Ensure credentials are correct

### "Frontend can't connect to backend"
- ✅ Verify `NEXT_PUBLIC_API_URL` is correct
- ✅ Check backend is running (visit health endpoint)
- ✅ Verify CORS allows frontend origin

### "Build fails on Render"
- ✅ Check build logs in Render dashboard
- ✅ Verify all dependencies are in `package.json`
- ✅ Ensure `NODE_ENV=production` doesn't break dev features

### "TypeScript compilation errors"
- ✅ Run `npm run build` locally to test
- ✅ Check tsconfig.json settings
- ✅ Verify all types are installed

---

## Important Render Commands

```bash
# For Render Shell (via dashboard Connect):

# Check Node version
node --version

# Run database migrations
npm run db:push

# Seed database
npm run db:seed

# View environment variables
env | grep DATABASE_URL

# Restart service
# (Via Render dashboard - Manual option)
```

---

## Important Vercel Commands

```bash
# Deploy frontend directly
npm install -g vercel
vercel --prod

# Preview deployment
vercel --prod

# View environment variables
vercel env pull .env.local

# Check preview URL
# (Shown in deploy output)
```

---

## Cost Breakdown (Monthly)

| Service | Free Tier | Paid Tier | Our Cost |
|---------|-----------|-----------|----------|
| **Render** | Free | $7+ | Free (starter) → $7+ |
| **Vercel** | Free | $20+ | Free (hobby) → $20+ |
| **Neon** | Free | $14+ | Free (5 projects) |
| **Upstash** | Free | $0.25/100k | Free (limited) |
| **TOTAL** | - | - | **~$27+/month** |

---

## Post-Deployment

1. **Monitor Logs**
   - Render: Service → Logs
   - Vercel: Deployments → Logs

2. **Set Up Alerts**
   - Render: Settings → Notification
   - Vercel: Project Settings → Alerts

3. **Enable Auto-Deployments**
   - Both platforms auto-deploy on git push

4. **Regular Maintenance**
   - Check logs weekly
   - Monitor database size
   - Review error rates

---

## Support

- 📚 [Full Deployment Guide](./DEPLOYMENT.md)
- 🐛 Check logs first for errors
- 💬 Issues? Check service status pages
- 📖 Read service-specific documentation

---

**Last Updated**: 2024  
**Deployment Ready**: ✅ Yes  
**Next Step**: Push code and deploy!
