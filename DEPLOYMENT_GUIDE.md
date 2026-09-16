# 🚀 Blast Crackers — Complete Step-by-Step Deployment Guide

Follow these 13 exact steps to take the Blast Crackers website live on the internet.

---

### STEP 1 — Create Supabase project
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project** (or **Sign In**).
2. Click **New Project**.
3. Fill in the fields:
   - **Name**: `blast-crackers`
   - **Database Password**: Choose a strong password and write it down.
   - **Region**: Select `South Asia (Mumbai)` (or closest to your target customers).
4. Click **Create new project** and wait ~2 minutes for it to finish setting up.

---

### STEP 2 — Copy PostgreSQL DATABASE_URL
1. In your Supabase project dashboard, click the **Project Settings** (gear icon at the bottom of the left sidebar).
2. Click **Database** under the Configuration menu.
3. Scroll down to the **Connection String** section.
4. Click the **URI** tab.
5. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
   *(Or direct port 5432: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)*
6. Replace `[YOUR-PASSWORD]` with your actual password from Step 1.

---

### STEP 3 — Put DATABASE_URL into Render
*(You will paste this in Step 5 during backend setup on Render)*.
Have this URI ready in your clipboard.

---

### STEP 4 — Create Render backend
1. Push this code repository to your **GitHub** account.
2. Go to [https://render.com](https://render.com) and sign in.
3. Click the **New +** button in the top navigation bar and select **Web Service**.
4. Choose **Build and deploy from a Git repository** and click **Next**.
5. Connect your GitHub account and select your `blast` repository.
6. Configure the Web Service settings with these exact values:
   - **Name**: `blast-crackers-backend`
   - **Language / Runtime**: `Node`
   - **Region**: `Singapore` (or region closest to Mumbai)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Build Command**:
     ```bash
     npm install
     ```
   - **Start Command**:
     ```bash
     npm run migrate && npm run seed && npm start
     ```
   - **Instance Type**: `Free`

---

### STEP 5 — Add backend environment variables
Scroll down to the **Environment Variables** section on Render, click **Add Environment Variable**, and add each of these exact keys and values:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | *(Your Supabase URI from Step 2)* | Starts with `postgresql://...` |
| `JWT_SECRET` | `blast_super_secure_festive_jwt_secret_2026_x99` | Min 32 characters |
| `FRONTEND_URL` | `http://localhost:5173` | *(Temporary — you will update this in Step 11)* |
| `CORS_ORIGIN` | `http://localhost:5173` | *(Temporary — you will update this in Step 11)* |
| `SHOP_UPI_ID` | `YOUR_UPI_ID@upi` | Your UPI ID to receive payments |
| `SHOP_NAME` | `Blast Crackers Sivakasi` | Payee name shown on UPI app screens |
| `REQUIRE_UTR` | `true` | Requires customers to enter 12-digit UTR |
| `PAYMENT_EXPIRY_MINUTES` | `15` | Window for completing payment |

*(Optional: If using Cloudinary for product image storage, also add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`).*

---

### STEP 6 — Deploy backend
1. Click **Create Web Service** (or **Deploy Web Service**).
2. Watch the Render deployment logs. You will see:
   ```
   Executing migration: 001_create_schema.sql
   ✅ Migration 001_create_schema.sql executed successfully.
   ✨ PostgreSQL Database migration successfully completed!
   🌱 Connecting to Cloud PostgreSQL for seeding...
   ✅ 10 Categories verified/seeded.
   ✅ 25 Products verified/seeded.
   🎆 Blast Crackers Server running at http://localhost:...
   ```
3. Wait until the status badge turns green (**Live**).

---

### STEP 7 — Copy Render backend URL
1. At the top of your Render Web Service dashboard, locate your public URL.
2. It looks like:
   ```
   https://blast-crackers-backend.onrender.com
   ```
3. Copy this URL. Verify it by visiting `https://blast-crackers-backend.onrender.com/api/health` in your browser. You should see:
   ```json
   {"status":"ok","store":"Blast Crackers","version":"1.0.0"}
   ```

---

### STEP 8 — Create Vercel frontend
1. Go to [https://vercel.com](https://vercel.com) and sign in.
2. Click **Add New...** -> **Project**.
3. Select your GitHub `blast` repository and click **Import**.
4. Configure the project settings:
   - **Project Name**: `blast-crackers`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select **`client`** (IMPORTANT).
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

---

### STEP 9 — Set VITE_API_URL
In the Vercel import screen, expand the **Environment Variables** section and add:
- **Key**: `VITE_API_URL`
- **Value**: `https://blast-crackers-backend.onrender.com` *(Your exact Render URL from Step 7 without trailing slash)*

---

### STEP 10 — Deploy frontend
1. Click **Deploy**.
2. Vercel will build the React Vite bundle in ~30 seconds.
3. Once the confetti appears, copy your live Vercel frontend URL (e.g. `https://blast-crackers.vercel.app`).

---

### STEP 11 — Update Render FRONTEND_URL/CORS_ORIGIN with Vercel URL
1. Go back to your **Render** dashboard -> click your `blast-crackers-backend` Web Service.
2. Click **Environment** in the left menu.
3. Edit the following two variables:
   - **`FRONTEND_URL`**: `https://blast-crackers.vercel.app` *(Your Vercel URL from Step 10)*
   - **`CORS_ORIGIN`**: `https://blast-crackers.vercel.app` *(Your Vercel URL from Step 10)*
4. Click **Save Changes**. Render will automatically redeploy with the updated CORS whitelist.

---

### STEP 12 — Test website
Open your live Vercel URL in your browser:
1. **Catalog**: Verify 25 Sivakasi green crackers load with photos, prices, and categories.
2. **Customer Flow**:
   - Add items to cart.
   - Click **Checkout**.
   - Log in with pre-seeded customer: `customer@gmail.com` / `Customer@123`.
   - Select the pre-seeded Madurai delivery address.
   - Select **UPI Payment** -> Verify the dynamic QR code shows the exact order total.
   - Click **I Have Completed Payment** -> enter a 12-digit UTR (e.g. `123456789012`).
   - Confirm order -> view instant order confirmation with tracking number.
3. **Admin Dashboard Flow**:
   - Log in with pre-seeded administrator: `admin@blastcrackers.com` / `Admin@123`.
   - Click **Admin Panel** in the top navigation.
   - Go to **Payments** -> locate the pending payment -> click **Verify & Approve**.
   - Go to **Orders** -> update order status to `Processing`, `Packed`, or `Dispatched`.
   - Go to **Products** -> click **Add Product** -> click **[Upload File]** to upload a cracker image.

---

### STEP 13 — Give client the Vercel URL
Send the live Vercel link and test credentials to your client:
- **Website URL**: `https://blast-crackers.vercel.app`
- **Customer Test Account**: `customer@gmail.com` / `Customer@123`
- **Admin Test Account**: `admin@blastcrackers.com` / `Admin@123`
