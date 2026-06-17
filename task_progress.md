# Connecting Render (Backend) + Vercel (Frontend) — Complete Guide

## 1. Current Project Architecture

```
Frontend (Vercel)                          Backend (Render)
┌──────────────────┐                    ┌──────────────────────┐
│  React + Vite     │   fetch() calls   │  Express.js          │
│  VITE_API_URL ────┼──────────────────►│  /api/auth/*         │
│                   │   CORS headers    │  /api/events/*       │
│  Vercel domain    │◄──────────────────┤  /api/bookings/*     │
│  (eventflow.vercel│   JSON responses  │  ...                 │
│   .app)           │                    │  Render domain       │
└──────────────────┘                    │  (eventflow-backend  │
                                         │   .onrender.com)     │
                                         └──────────┬───────────┘
                                                     │
                                         ┌──────────▼───────────┐
                                         │  PostgreSQL (Render) │
                                         └──────────────────────┘
```

## 2. Prerequisites

- [x] GitHub repo with your code (already connected)
- [x] Prisma schema switched from SQLite to PostgreSQL
- [x] PostgreSQL driver (`pg`) installed
- [x] `.env` and `.env.example` updated for PostgreSQL
- [ ] Render account — [render.com](https://render.com)
- [ ] Vercel account — [vercel.com](https://vercel.com)
- [ ] Render PostgreSQL database

## 3. BACKEND — Deploy to Render

### Step 3.1: PostgreSQL Migration — ✅ DONE (with migration fix)

> **⚠️ Previous error**: Render failed with `P3019 - provider mismatch (sqlite vs postgresql)`
> **✅ Fix applied**: Old SQLite migrations deleted, fresh PostgreSQL migration created and pushed

The following changes have been made to your codebase:

#### `backend/prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### `backend/package.json` — `pg` driver added
```
"pg": "^8.21.0"
```

#### `backend/.env` (local development)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eventflow
UPLOAD_DIR=./uploads
```

#### `backend/.env.example` (template for production)
```
DATABASE_URL="postgresql://user:password@host:5432/eventflow"
UPLOAD_DIR=./uploads
```

#### Prisma Client regenerated
- ✅ Generated v5.22.0 successfully for PostgreSQL schema

### Step 3.2: Update `backend/package.json` build script

No change needed — `build` already runs `npx prisma generate`:
```json
"scripts": {
  "build": "npx prisma generate",
  "start": "node src/server.js"
}
```

### Step 3.3: Update CORS in `backend/src/server.js`

**No change needed** — your CORS is already dynamic:
```js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Step 3.4: Configure Render Service

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `eventflow-backend` |
| **Region** | Choose closest to you (e.g., Frankfurt) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npx prisma migrate deploy && node src/server.js` |
| **Instance Type** | Free |

5. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `FRONTEND_URL` | `https://eventflow.vercel.app` (your Vercel URL) |
| `DATABASE_URL` | Your Render PostgreSQL connection string |
| `JWT_SECRET` | A strong random secret (e.g., from `openssl rand -hex 64`) |
| `UPLOAD_DIR` | `/tmp/uploads` |

### Step 3.5: Create Render PostgreSQL Database

1. In Render Dashboard, click **New +** → **PostgreSQL**
2. Name: `eventflow-db`
3. After creation, copy the **Internal Database URL** and paste into `DATABASE_URL` env var
4. Note: Free tier databases expire after 90 days

### Step 3.6: Handle File Uploads

> **⚠️ IMPORTANT**: You're using `multer` with local disk storage (`./uploads`). Render's filesystem is **ephemeral** — uploaded files will be lost on restart.

**Option A (Simple):** Use Render's Disk feature (paid add-on)
**Option B (Recommended):** Use Cloudinary or AWS S3 for file uploads

The `UPLOAD_DIR` env var is already configured for this.

## 4. FRONTEND — Deploy to Vercel

### Step 4.1: Vite proxy config

The proxy in `frontend/vite.config.ts` is fine to leave — Vite ignores `server.proxy` during production builds:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### Step 4.2: Configure Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

5. Add Environment Variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://eventflow-backend.onrender.com/api` |

## 5. How the Frontend Connects to the Backend

Your frontend (`frontend/src/lib/api.ts`) reads the API URL like this:
```typescript
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '')
  || 'http://localhost:5000/api';
```

In production on Vercel, it will use `VITE_API_URL` (set in Vercel dashboard).
In development, it falls back to `http://localhost:5000/api`.

## 6. Key Connection Flow

```
User's Browser
     │
     ▼
Vercel (Frontend)
  https://eventflow.vercel.app
     │
     │ fetch('https://eventflow-backend.onrender.com/api/events')
     │ + Authorization: Bearer <token>
     ▼
Render (Backend)
  https://eventflow-backend.onrender.com
     │
     │ CORS origin: https://eventflow.vercel.app ✓
     │
     ▼
PostgreSQL (Render Database)
```

## 7. Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://eventflow.vercel.app
DATABASE_URL=postgresql://user:pass@host:5432/eventflow
JWT_SECRET=<generate-a-strong-secret>
UPLOAD_DIR=/tmp/uploads
```

### Frontend (Vercel)
```
VITE_API_URL=https://eventflow-backend.onrender.com/api
```

## 8. Testing the Connection

After deploying both:

1. Test backend health:
```bash
curl https://eventflow-backend.onrender.com/health
```
Expected: `{ "success": true, "message": "EventFlow API is running", ... }`

2. Open your Vercel URL in browser — should load the app and connect to the API.

3. Test CORS by opening browser DevTools → Network tab and verifying API calls succeed.

## 9. Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| `Failed to fetch` in browser | CORS misconfigured | Check `FRONTEND_URL` on Render matches Vercel URL exactly |
| `ECONNREFUSED` | Render service not started | Check Render logs; service may be cold-starting (up to 30s on free tier) |
| Prisma errors | Database migration failed | Run `npx prisma migrate deploy` manually via Render Shell |
| 404 on API routes | Incorrect `VITE_API_URL` | Should end with `/api` — e.g., `https://...onrender.com/api` |
| No data after restart | PostgreSQL not configured | ✅ Already handled — schema now uses PostgreSQL |
| Uploaded files disappear | Ephemeral filesystem | Migrate to Cloudinary/S3 for permanent file storage |

## 10. Quick Checklist

- [x] Prisma schema updated for PostgreSQL
- [x] PostgreSQL driver (`pg`) installed
- [x] `.env` / `.env.example` updated
- [x] Prisma Client regenerated for PostgreSQL
- [ ] Backend deployed to Render with correct env vars
- [ ] PostgreSQL database created on Render
- [ ] Prisma migrations run successfully
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set on Vercel
- [ ] CORS origin matches Vercel URL
- [ ] Health check endpoint returns success
- [ ] Test full flow — register, login, create event, book tickets