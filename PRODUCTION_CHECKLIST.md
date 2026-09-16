# ✅ Blast Crackers — Production Deployment Checklist (24 Items)

Use this checklist before releasing or client-testing the Blast Crackers e-commerce application.

---

### Database & Persistence
- [x] **1. Dual-Engine Architecture**: Automatic switching between Cloud PostgreSQL (`DATABASE_URL`) and local SQLite (`data/database.sqlite`).
- [x] **2. Cloud SSL Encryption**: PostgreSQL connections configured with `ssl: { rejectUnauthorized: false }` for Supabase/Render/Neon compatibility.
- [x] **3. Automated Migrations**: Runner `npm run migrate` safely executes DDL (`server/db/migrations/001_create_schema.sql`).
- [x] **4. Complete Schema (13 Tables)**: `users`, `categories`, `products`, `product_images`, `cart`, `cart_items`, `addresses`, `orders`, `order_items`, `payments`, `order_timeline`, `coupons`, `settings`.
- [x] **5. Optimized Query Indexes**: 16 dedicated B-tree indexes for fast lookups on foreign keys, status filters, slugs, and timestamps.
- [x] **6. Referential Integrity**: Foreign keys with `ON DELETE CASCADE` for line items and `ON DELETE SET NULL` for user-associated orders.
- [x] **7. Production Database Seeding**: `npm run seed` populates 10 Sivakasi categories, 25 high-detail green cracker products, coupons, default settings, and demo customer data.

---

### Authentication & Authorization
- [x] **8. Password Hashing**: Passwords stored using industry-standard bcrypt with work factor salt of 10.
- [x] **9. JWT Token Security**: Signed JWT tokens with strict role payload (`admin` vs `customer`).
- [x] **10. Role-Based Middleware**: `adminRequired` guard protecting all administrative write/read endpoints.
- [x] **11. Pre-Seeded Admin & Customer**: Known testing accounts with default credentials documented in `DEPLOYMENT_GUIDE.md`.

---

### Security & Compliance
- [x] **12. Zero-Trust Price Calculation**: Subtotals, discounts, delivery fees, and grand totals are verified strictly against database values upon order placement; client-tampered totals are rejected.
- [x] **13. Rate Limiting**: Dedicated in-memory rate limiters on `/api/auth/login`, `/api/auth/register`, and `/api/orders/create`.
- [x] **14. HTTP Security Headers**: Explicitly configured `nosniff`, `SAMEORIGIN` X-Frame-Options, XSS protection, and restrictive permissions policy.
- [x] **15. Dynamic Cross-Origin Resource Sharing (CORS)**: Configured to support `FRONTEND_URL` and `CORS_ORIGIN` alongside credentials and standard headers.
- [x] **16. Secrets Protection**: Strict `.gitignore` preventing `.env`, `.env.*`, and `data/*.db*` from being committed to source control.

---

### Payment & Checkout
- [x] **17. Dynamic UPI QR Generation**: Payee URI formatted with `pa`, `pn`, `am`, `cu=INR`, and unique transaction reference `tr`.
- [x] **18. Configurable UPI Settings**: Shop UPI ID (`shop_upi_id`) and store name dynamically loaded from database settings or environment variables.
- [x] **19. UTR Verification Flow**: 12-digit transaction reference capture with real-time validation and administrative review queue.
- [x] **20. Order Tracking Timeline**: Real-time multi-stage status updates (`pending_payment` -> `payment_verification` -> `confirmed` -> `processing` -> `dispatched` -> `delivered`).

---

### Media & Responsive Experience
- [x] **21. Cloud Media Upload**: Modular `storageService.js` supporting Cloudinary, Supabase Storage, and local storage fallback.
- [x] **22. Admin Image Uploader UI**: Built-in file picker with instant preview inside the product creation and editing modal.
- [x] **23. Universal Viewport Responsiveness**: Verified fluid layouts on mobile devices (320px–480px), tablets (768px–1024px), laptops, and desktop monitors.
- [x] **24. Automated Test Suite (100% Pass)**: All unit, integration, checkout, UPI, responsive, and cloud compatibility test suites pass without error.
