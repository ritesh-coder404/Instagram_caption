# CaptionCraft 🚀
> Production-grade AI Caption & Hashtag Suite for Instagram Reels Creators. Built with React (Vite), Tailwind CSS, Node.js/Express, Supabase, Google Gemini 2.5 Flash, FFmpeg, and Razorpay.

---

## 📌 Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT (Vite SPA)                                |
|   /                      /pricing              /login            /signup          |
|   Landing Page           Pricing Tiers         Supabase Auth     Supabase Auth    |
|                                                                                   |
|   +-------------------------------+   +---------------------------------------+   |
|   |   USER PORTAL (/app)          |   |   ADMIN PANEL (/admin)                |   |
|   |   - Dashboard (Usage Meter)   |   |   - Executive KPIs & Recharts         |   |
|   |   - Generator (Text & Video)  |   |   - User Control & Suspend/Activate   |   |
|   |   - History & Search          |   |   - Content Moderation & Flagging     |   |
|   |   - Saved Collections         |   |   - Hashtag Library CRUD + Bulk Import|   |
|   |   - Billing (Razorpay Test)   |   |   - Payments Audit & CSV Export       |   |
|   |   - Settings                  |   |   - Dynamic Plans & Audit Trail       |   |
|   +-------------------------------+   +---------------------------------------+   |
+-----------------------------------------------------------------------------------+
                                         │  Authorization: Bearer <Supabase JWT>
                                         ▼
+-----------------------------------------------------------------------------------+
|                             BACKEND API (Node.js / Express)                       |
|   Helmet · CORS Whitelist · Rate Limiting · Centralized Error Handling            |
|                                                                                   |
|   [Middlewares]                                                                   |
|   - requireAuth: Verifies Supabase JWT via auth.getUser(); blocks suspended users  |
|   - requireAdmin: Queries profiles directly for role='admin' & status='active'    |
|   - checkLimit: Dynamic quota enforcement (plans table), HTTP 402 on exhaustion   |
|                                                                                   |
|   [Services & Routes]                                                             |
|   - /api/generate & /api/generate-from-video (Gemini 2.5 Flash Text & Vision)     |
|   - /api/jobs/:id (Async video queue with fluent-ffmpeg audio/frame extraction)   |
|   - /api/payments/create-order & /api/payments/webhook (HMAC Signature Verified) |
|   - /api/admin/* (Protected by requireAdmin + admin_logs audit tracking)          |
+-----------------------------------------------------------------------------------+
                                         │
                    ┌────────────────────┴────────────────────┐
                    ▼                                         ▼
+---------------------------------------+   +-----------------------------------+
|          SUPABASE (PostgreSQL)        |   |       EXTERNAL SERVICES           |
| - Row Level Security on EVERY table   |   | - Google Gemini 2.5 Flash API     |
| - is_admin() SECURITY DEFINER func    |   | - Razorpay Payment Gateway        |
| - On signup trigger: profile + usage  |   | - fluent-ffmpeg Media Pipeline    |
| - Private Storage Bucket: "videos"    |   +-----------------------------------+
+---------------------------------------+
```

---

## ⚡ Features

### 1. User Portal (`/app`)
* **3-Tier Curated Hashtag Engine**:
  * **High-reach**: 5 broad tags for macro categorization.
  * **Medium**: 8 community and sub-niche tags.
  * **Niche**: 10 targeted tags for low-competition discovery.
* **Multimodal Generation**:
  * **From Topic**: Input an idea, select tone (*Professional, Funny, Motivational, Storytelling*) and language (*English, Hindi, Hinglish*).
  * **From Video**: Upload MP4/MOV videos up to 60s (50MB). Audio is transcribed and frames are visually analyzed via Gemini Vision.
* **Full Creator Workflow**:
  * One-click copying of Hooks, Captions, Hashtags, or the entire combined package.
  * Saved Hashtag Collections with bulk management.
  * Searchable historical generations with pagination and deletion.
  * Real-time generation quota meter in the navigation bar.

### 2. Admin Panel (`/admin`)
* **Executive Metrics Dashboard**: Live counts of users, 7-day signups, Pro subscribers, generations, total revenue, and estimated Gemini API costs.
* **Interactive Charts (Recharts)**: User signups over time, generations per day, and plan distribution.
* **User Management**: Search, filter by plan/status, suspend or activate accounts, manually override plans, or reset monthly usage counts. (Safety rule: Admin cannot suspend self).
* **Content Moderation**: Flag/unflag inappropriate generations and permanently delete violations.
* **Hashtag Library**: Full CRUD, bulk CSV/text import, niche/size filtering, and active/inactive toggle switches.
* **Plans & Pricing**: Edit prices, monthly generation limits, and active visibility in real-time without modifying code.
* **Security & Audit Trail**: CSV export of users/generations and an immutable audit log viewer (`admin_logs`).

---

## 🛠️ Security Architecture & Strict Rules

1. **Zero Secrets on Client**: All LLM, Razorpay, and Supabase Service Role keys reside strictly in `server/.env`.
2. **Cryptographic JWT Verification**: Backend verifies `Authorization: Bearer <token>` against `supabaseAdmin.auth.getUser()`. The `user_id` is never trusted from the client payload.
3. **Live Database Role Validation**: `requireAdmin` checks `profiles` table directly on every admin request. Non-admin users visiting `/admin` receive a strict HTTP 403 Forbidden page.
4. **Row Level Security (RLS)**: Enforced across all tables. Admin operations use the `is_admin()` Security Definer function to bypass recursion without exposing the service key to clients.
5. **Verified Webhook Upgrade**: Plan upgrades from Free to Pro occur **only** after validating the Razorpay HMAC SHA256 webhook signature.

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js**: v18+ (verified on v24)
* **Python**: v3.10+
* **FFmpeg**: Installed and available in PATH (for video audio/frame extraction)

### 1. Database Setup in Supabase
1. Open your Supabase Project dashboard.
2. Navigate to the **SQL Editor**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql), paste the entire script, and click **Run**.
4. This creates all tables, indexes, triggers, storage bucket policies, and seeds the default plans.

### 2. Configure Environment Variables

#### `server/.env`
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_yourkeyid
RAZORPAY_KEY_SECRET=your-secret-key
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

#### `client/.env`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_yourkeyid
```

### 3. Seed Hashtags Library
Run the database seed script to populate over 300 curated hashtags across 8 niches:
```bash
cd server
npm run seed
```

### 4. Run Locally
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👑 Promoting Your Account to Admin
1. Sign up through the app at `/signup`.
2. Open the Supabase SQL Editor and run:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```
3. Refresh your browser; you will now have access to `/admin` and the Admin Control Console switcher in the sidebar.

---

## 🌐 Production Deployment Guide

### Client on Vercel
1. Link your GitHub repository to Vercel.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variables:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
   * `VITE_API_URL` (URL of your Render backend API)
   * `VITE_RAZORPAY_KEY_ID`
5. The bundled [`client/vercel.json`](./client/vercel.json) handles SPA routing rewrites.

### Server on Render
1. Create a **New Web Service** on Render.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`.
4. Set **Start Command**: `npm start`.
5. Add Environment Variables from `server/.env`.
6. In Razorpay Dashboard, set the Webhook URL to:
   `https://your-render-app.onrender.com/api/payments/webhook` with event `payment.captured`.
