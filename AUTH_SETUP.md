# Google Authentication Setup Guide

This application uses Google OAuth 2.0 to securely authenticate users. To run the app locally or in production, you must configure a Google Cloud project and supply the credentials.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services > OAuth consent screen**.
4. Choose **External** (if you want anyone with a Google account to log in) and click **Create**.
5. Fill in the required fields (App name, User support email, Developer contact information) and click **Save and Continue**.
6. (Optional) Add scopes if needed, but the default email and profile scopes are sufficient. Click **Save and Continue**.
7. If your app is in "Testing" mode, add your own email to the **Test users** list. Click **Save and Continue**.

## Step 2: Create OAuth Credentials

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials** and select **OAuth client ID**.
3. Choose **Web application** as the Application type.
4. Set a name for the client (e.g., "ResumeAI Web Client").
5. Under **Authorized JavaScript origins**, add your frontend URLs:
   - For local development: `http://localhost:3000`
   - For production: `https://your-production-url.vercel.app` (e.g., `https://resume-ai-beta-lake.vercel.app`)
6. (Optional) Under **Authorized redirect URIs**, you can add the same URLs if using redirect-based auth (our setup uses popup-based auth, so origins are usually enough).
7. Click **Create**.
8. You will receive your **Client ID**. (You do not need the Client Secret for this specific frontend implementation).

## Step 3: Configure Environment Variables

You need to update your `.env` files in both the frontend (if deployed separately) and backend.

### Master `.env` (Root directory) & Backend `.env`

```env
# The Client ID you just created
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# A secure random string used to sign your backend JWTs (e.g. generate via `openssl rand -hex 32`)
JWT_SECRET=your_super_secret_jwt_key

# Comma-separated list of admin emails
ADMIN_EMAILS=your.email@gmail.com

# Database URL
DATABASE_URL=sqlite:///./resumeai.db
```

### Frontend Vercel Environment Variables

When deploying the frontend to Vercel, you must add the Google Client ID as a `NEXT_PUBLIC_` variable so the React app can access it in the browser:

- Key: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- Value: `your-google-client-id.apps.googleusercontent.com`

## Step 4: Database Persistence (Production Note)

By default, the backend is configured to use a local SQLite database (`sqlite:///./resumeai.db`).
If you are deploying the backend to a free tier on Render, **the file system is ephemeral**. This means your database (and all users/quotas) will be wiped every time the server spins down.

**To fix this for production:**
1. Create a free PostgreSQL database (e.g., using [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [Render Postgres](https://render.com/)).
2. Copy the connection string (e.g., `postgresql://user:password@hostname/dbname`).
3. Update the `DATABASE_URL` environment variable on your Render backend deployment to point to your new Postgres database.
4. The application uses SQLAlchemy and will automatically create the tables on startup.
