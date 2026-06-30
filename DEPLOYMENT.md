# Resume AI — Deployment Guide

Step-by-step instructions to deploy the Resume AI application to production using **Render** (backend) and **Vercel** (frontend).

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy Backend to Render](#deploy-backend-to-render)
3. [Deploy Frontend to Vercel](#deploy-frontend-to-vercel)
4. [Connect Frontend ↔ Backend](#connect-frontend--backend)
5. [Production Checklist](#production-checklist)
6. [Common Issues & Fixes](#common-issues--fixes)

---

## Prerequisites

- A **GitHub** account with this repository pushed.
- A **Render** account (free tier works): [render.com](https://render.com)
- A **Vercel** account (free tier works): [vercel.com](https://vercel.com)
- At least one AI API key (Gemini, Groq, or OpenRouter).

---

## Deploy Backend to Render

### Step 1: Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `resume-ai-api` (or your choice) |
| **Region** | Oregon (US West) — or closest to you |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT` |
| **Instance Type** | Free (or Starter for production) |

### Step 2: Add Environment Variables

In the Render dashboard, go to **Environment** tab and add:

| Variable | Value | Required |
|---|---|---|
| `ENVIRONMENT` | `production` | ✅ |
| `FRONTEND_URL` | *(set after Vercel deploy)* | ✅ |
| `AI_PROVIDER` | `gemini` | ✅ |
| `GEMINI_API_KEY` | Your Gemini API key | ✅ |
| `GROQ_API_KEY` | Your Groq API key | Optional |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Optional |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | Optional |
| `OPENROUTER_MODEL` | `google/gemini-2.5-flash` | Optional |
| `MAX_FILE_SIZE` | `5242880` | Optional |
| `LOG_LEVEL` | `INFO` | Optional |

> **Note:** Do NOT set `PORT` — Render provides it automatically.

### Step 3: Configure Health Check

In **Settings** → **Health Check Path**, set:
```
/health
```

### Step 4: Deploy

Click **"Create Web Service"**. Render will:
1. Clone your repo
2. Run `pip install -r requirements.txt`
3. Start the server with gunicorn
4. Verify the health check at `/health`

**Copy your Render URL** (e.g. `https://resume-ai-api.onrender.com`) — you'll need it for Vercel.

### Alternative: Blueprint Deploy (One-Click)

If you prefer, use the included `render.yaml` Blueprint:
1. Go to [Render Blueprint](https://dashboard.render.com/blueprints)
2. Click **"New Blueprint Instance"**
3. Connect your repo — Render reads `render.yaml` automatically
4. Fill in the secret env vars when prompted
5. Click Deploy

---

## Deploy Frontend to Vercel

### Step 1: Import Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository

### Step 2: Configure Project

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Next.js *(auto-detected)* |
| **Build Command** | `npm run build` *(default)* |
| **Output Directory** | *(leave default — auto-detected)* |
| **Install Command** | `npm install` *(default)* |

### Step 3: Add Environment Variables

Add this environment variable:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Render backend URL (e.g. `https://resume-ai-api.onrender.com`) |

> **Important:** The variable MUST start with `NEXT_PUBLIC_` for Next.js to expose it to the browser.

### Step 4: Deploy

Click **"Deploy"**. Vercel will:
1. Install dependencies (`npm install`)
2. Build the Next.js app (`npm run build`)
3. Deploy to a global CDN

**Copy your Vercel URL** (e.g. `https://resume-ai.vercel.app`).

---

## Connect Frontend ↔ Backend

After both services are deployed, you need to link them:

### 1. Set FRONTEND_URL on Render

1. Go to your Render service → **Environment**
2. Set `FRONTEND_URL` to your Vercel URL:
   ```
   https://resume-ai.vercel.app
   ```
   *(Use your actual Vercel domain, no trailing slash)*
3. Click **Save Changes** — Render will automatically redeploy.

### 2. Verify the Connection

1. Visit your Vercel URL
2. Upload a resume and paste/scrape a job description
3. Click "Optimize Resume"
4. Verify all features work: analysis, optimization, export

---

## Production Checklist

- [ ] Backend is running on Render and `/health` returns `{"status": "ok"}`
- [ ] Frontend is deployed on Vercel and loads correctly
- [ ] `NEXT_PUBLIC_API_URL` on Vercel points to the Render backend URL
- [ ] `FRONTEND_URL` on Render points to the Vercel frontend URL
- [ ] CORS is working (no console errors about blocked requests)
- [ ] File upload works (PDF/DOCX parsing)
- [ ] AI analysis and optimization work
- [ ] PDF/DOCX export and download work
- [ ] No `localhost` URLs appear in production network requests
- [ ] No API keys are committed to the repository
- [ ] Health check is configured on Render

---

## Common Issues & Fixes

### Render

| Issue | Fix |
|---|---|
| **Build fails: "No module named X"** | Make sure the dependency is in `requirements.txt`. |
| **Server crashes on startup** | Check Render logs. Ensure all required env vars are set. |
| **Health check fails** | Verify `/health` returns `{"status": "ok"}`. The start command must bind to `0.0.0.0:$PORT`. |
| **CORS errors in browser** | Set `FRONTEND_URL` to your exact Vercel domain (with `https://`, no trailing `/`). |
| **Slow cold starts (Free tier)** | Free tier spins down after 15 min of inactivity. Upgrade to Starter ($7/mo) for always-on. |
| **File uploads fail** | Render supports in-memory file uploads out of the box. Ensure `MAX_FILE_SIZE` isn't exceeded. |
| **Port issues** | Never hardcode a port. The app reads `$PORT` from Render automatically. |

### Vercel

| Issue | Fix |
|---|---|
| **Build fails** | Run `npm run build` locally first. Fix any TypeScript or ESLint errors. |
| **API calls go to localhost** | Ensure `NEXT_PUBLIC_API_URL` is set in Vercel Environment Variables. Redeploy after adding it. |
| **"Network Error" or fetch fails** | Check that the Render backend is running and CORS is configured. |
| **Environment variable not working** | Variables must start with `NEXT_PUBLIC_` to be available in the browser. Redeploy after changes. |
| **Blank page after deploy** | Check the Vercel build logs for errors. Ensure `Root Directory` is set to `frontend`. |

---

## Quick Reference — Service Settings

### Render

```
Root Directory:    backend
Build Command:     pip install -r requirements.txt
Start Command:     gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
Health Check:      /health
```

### Vercel

```
Root Directory:    frontend
Framework:         Next.js (auto-detected)
Build Command:     npm run build (default)
Output Directory:  (auto-detected)
```
