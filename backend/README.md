# 🛡️ BlotChain-MEVShield Risk Engine Backend

Node.js / Express backend service for real-time MEV threat analysis and EIP-712 off-chain policy signatures (`SignedRiskPayload`).

---

## 🚀 Quick Start (Local Run)

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```
   The backend will start at `http://localhost:3001`.

---

## 🌐 Deploying to Production (Choose One)

### Option A: Railway (Fastest & Easiest)
1. Go to [Railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository (`BlotChain-MEVShield`).
4. In **Settings** -> **Root Directory**, set it to `backend`.
5. Railway will automatically detect Node.js and run `npm start`.
6. Copy your public domain URL (e.g. `https://mevshield-backend.up.railway.app`).

### Option B: Render
1. Go to [Render.com](https://render.com) and create a **Web Service**.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Copy your public HTTPS URL (e.g. `https://mevshield-backend.onrender.com`).

---

## 🔗 Connecting Backend to Frontend on Vercel

1. Go to your **BlotChain-MEVShield** project on [Vercel](https://vercel.com).
2. Go to **Settings** -> **Environment Variables**.
3. Add a new variable:
   - **Key:** `VITE_RISK_ENGINE_BACKEND_URL`
   - **Value:** `https://your-backend-url.up.railway.app` (your deployed backend URL)
4. Trigger a **Redeploy** on Vercel.
5. Open your live frontend app. The 3D Threat Visualizer will now pull live threat events directly from your deployed backend!
