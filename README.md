# Vect — Truth Infrastructure

AI-powered claim verification. Verify text, URLs, and PDFs and get a Trust Score in seconds.

---

## Local development

```bash
npm install
npx expo start          # opens Expo Go / dev menu
npx expo start --web    # run as web app in browser
```

---

## Deploying to Vercel (web app — `app.vect.app`)

The `vercel.json` at the repo root configures the Expo web build. Follow these steps **once**:

### Step 1 — Create a new Vercel project
1. Go to [vercel.com/new](https://vercel.com/new) and click **Add New Project**
2. Import the **`sultanraflyy/vect-app`** repo
3. Make sure **Root Directory** is set to `.` (the repo root, not `web/landing`)
4. Vercel will auto-detect `vercel.json` — leave all build settings as-is
5. Click **Deploy**

The first deploy URL will look like `vect-app-xxx.vercel.app`.

### Step 2 — Add environment variable
In your Vercel project → **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://cthfnflyccdogaxsysxl.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | *(your anon key)* |
| `EXPO_PUBLIC_APP_URL` | `https://app.vect.app` |

Then **redeploy** (Deployments → ⋯ → Redeploy).

### Step 3 — Add custom domain `app.vect.app`
1. In Vercel project → **Settings → Domains** → type `app.vect.app` → click **Add**
2. Vercel shows the required DNS record. Add a **CNAME** at your DNS provider:
   - **Name / Host**: `app`
   - **Value / Target**: `cname.vercel-dns.com`
3. Wait a few minutes for DNS to propagate — then `https://app.vect.app` is live ✅

### Step 4 — Add Supabase redirect URL
In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication → URL Configuration**:
- Add `https://app.vect.app/auth/callback` to **Redirect URLs**
- Add `https://app.vect.app` to **Site URL** (or keep it as a redirect URL)

### Step 5 — Enable Google OAuth (optional)
In Supabase Dashboard → **Authentication → Providers → Google**:
1. Enable Google provider
2. Copy the **Callback URL** shown by Supabase
3. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Add the Supabase callback URL as an **Authorized redirect URI**
5. Paste **Client ID** and **Client Secret** back into Supabase

---

## Deploying the landing page (`vect.app`)

The landing page lives in `web/landing/` and has its own `vercel.json`. Create a **second** Vercel project:

1. [vercel.com/new](https://vercel.com/new) → import the same repo
2. Set **Root Directory** to `web/landing`
3. Deploy → add custom domain `vect.app`

---

## Project structure

```
app/              Expo Router screens (login, onboarding, tabs, etc.)
components/       Reusable React Native components
lib/              Supabase client, verification engine, error handling
providers/        React context: Credits, Reports
web/landing/      Static landing page (separate Vercel project)
vercel.json       Expo web build config (for app.vect.app)
.env.example      Required environment variables
```

