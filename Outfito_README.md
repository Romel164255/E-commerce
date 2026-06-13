# Outfito — Full-Stack E-Commerce Platform

A production-style e-commerce application built with the **PERN** stack (PostgreSQL, Express, React, Node.js) and **TypeScript** on the backend. Includes catalog browsing, cart & checkout, Razorpay payments, order management, address/geocoding, and a full **admin support-ticket system** with refund and return workflows.

---

## Features

### Authentication & Authorization
- Email/password auth with **bcrypt** password hashing and **JWT** sessions.
- **Google OAuth 2.0** login via Passport.js, redirecting back to the frontend with a signed JWT.
- Role-based access control (`USER` / `ADMIN`) enforced via `authenticateToken` and `authorizeAdmin` middleware.
- Per-route **rate limiting** (`express-rate-limit`): stricter limits on `/auth/login`, `/auth/register`, and `/api/payment`, with a general limiter across all routes.

### Product Catalog
- Paginated, sortable product listing (`new`, `price_asc`, `price_desc`) with category/gender filters and HTTP caching headers (`stale-while-revalidate`).
- **Admin product creation** with image upload via Multer (memory storage, 5MB limit) and **Cloudinary** for hosting.
- Input validation using **Zod** schemas (e.g., price must be positive, stock non-negative).
- Full-text/search endpoint (`/search`) for product discovery.

### Cart & Checkout
- Authenticated cart operations: add, list (joined with product details), and remove items.
- Address management with **geocoding** (Google Geocode API types modeled for lat/lng + formatted address).
- Checkout flow creates a `PENDING` order from the cart against a saved address.

### Payments (Razorpay)
- Order creation generates a Razorpay order ID.
- **Payment verification** endpoint independently recomputes the HMAC-SHA256 signature (`razorpay_order_id|razorpay_payment_id`) using the Razorpay secret and compares it server-side — never trusts client-supplied "success" state.
- Verification runs inside a **Postgres transaction with row-level locking** (`SELECT ... FOR UPDATE`) to prevent double-processing.
- **Stock is decremented only after verified payment**, and only if sufficient stock exists for every line item — otherwise the transaction is rolled back.
- Idempotent: re-verifying an already-PAID order returns `alreadyPaid: true` without side effects.

### Order Management
- Order status lifecycle: `PENDING → PAID → SHIPPED → DELIVERED / CANCELLED`.
- Users can view their order history; admins manage fulfillment via admin routes.

### Support Ticket System (built end-to-end)
- Users open tickets against an order with a type: `RETURN`, `REFUND`, `COMPLAINT`, `OTHER`.
- Threaded messaging on each ticket (`user`/`admin` senders).
- **Admin resolution actions are tied to real backend consequences**:
  - `REFUND_ISSUED` → triggers a Razorpay refund via their refund API.
  - `RETURN_INITIATED` → updates order status and starts a **7-day return window**.
  - `REJECTED` → closes the ticket with an admin note.
- Status workflow: `OPEN → IN_PROGRESS → RESOLVED/CLOSED`, with separate endpoints for status patching vs. full resolution.
- Implemented via two SQL migrations (`004_tickets.sql`, `005_return_refund_cycle.sql`).

### Admin Dashboard
- Admin-only routes for managing products, orders, tickets, and viewing aggregate stats (`/api/stats`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite, Axios |
| Backend | Node.js, Express 5, TypeScript, tsx (dev) / tsc (build) |
| Database | PostgreSQL (`pg`), raw SQL with transactions |
| Auth | JWT, bcrypt, Passport (Google OAuth 2.0), express-session |
| Payments | Razorpay (order creation + HMAC signature verification) |
| Validation | Zod |
| Media | Cloudinary, Multer |
| Other | express-rate-limit, csv-parser, cookie-parser |
| Deployment | Vercel (frontend & backend) |

---

## Architecture

```
backend/
  index.ts                 App bootstrap: CORS, sessions, Passport, rate limiters, routes
  db.ts                     PostgreSQL pool
  types.ts, types/ticket.ts Shared TS interfaces (rows, DTOs, Razorpay/Geocode types)
  config/
    passport.ts             Google OAuth strategy
    cloudinary.ts
  middleware/
    auth.ts                 JWT verification → req.user
    admin.ts                 Role guard
    rateLimiter.ts           authLimiter, paymentLimiter, generalLimiter
    validate.ts, errorHandler.ts
  services/                 Business logic: auth, product, cart, order, address,
                             admin, search, ticket
  routes/                    auth, products, cart, order, address, search,
                             payment, admin, adminTickets, tickets, stats
  migrations/                SQL migrations (tickets, return/refund cycle)
frontend/
  src/App.jsx                React Router app (catalog, cart, checkout, account, admin)
```

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` / `/auth/login` | Email/password auth |
| GET | `/auth/google` / `/auth/google/callback` | Google OAuth flow |
| GET | `/products` | Paginated/sorted/filtered product list |
| POST | `/products` | Admin: create product (with image upload) |
| GET | `/search` | Product search |
| POST / GET / DELETE | `/cart` | Cart management |
| POST | `/orders/checkout` | Create order from cart |
| POST | `/orders/:id/pay` | Initiate Razorpay payment |
| GET | `/orders` | User order history |
| POST | `/api/payment/verify` | Verify Razorpay signature & finalize order |
| GET/POST | `/addresses` | Address management with geocoding |
| GET | `/api/stats` | Aggregate platform stats |
| POST | `/tickets` | Create support ticket |
| GET | `/tickets` / `/tickets/:id` | List / view tickets + thread |
| POST | `/tickets/:id/messages` | Reply to ticket |
| GET | `/admin/tickets` | Admin: list/filter tickets |
| POST | `/admin/tickets/:id/resolve` | Admin: REFUND_ISSUED / RETURN_INITIATED / REJECTED |
| PATCH | `/admin/tickets/:id/status` | Admin: update ticket status |
| `/admin/*` | Admin product/order management |

---

## Setup

### Backend
```bash
cd backend
npm install
# .env: DATABASE_URL, JWT_SECRET, SESSION_SECRET, GOOGLE_CLIENT_ID/SECRET,
#       RAZORPAY_KEY_ID/SECRET, CLOUDINARY_*, FRONTEND_URL
npm run dev      # tsx (development)
npm run build && npm start   # production
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## License
MIT
