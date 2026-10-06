# Reservia

A full-stack restaurant reservation and table management platform built for fine dining hospitality. From browsing curated dining experiences to reserving a table with real-time race-condition protection — every step is seamless, secure, and role-governed.

Built from the ground up with Node.js, Express, and MongoDB. No templates, no boilerplate generators.

🔗 https://reservia-x130.onrender.com

*The backend runs on a free-tier server and may take ~30s to wake up on the first request. After that, it's snappy.*

---

## The Problem

Table reservations shouldn't break during peak dining hours. Most systems are either bloated third-party aggregators charging hefty commissions or simplistic booking forms that collapse under concurrent surges, causing double-bookings, phantom reservations, and frustrated guests. Furthermore, aggregators suffer from operational disconnects, non-refundable booking fees, and rampant no-shows. 

Reservia is the sweet spot — delivering a luxury, custom-tailored dining experience on the frontend backed by enterprise-grade concurrency safety, automated WhatsApp reconfirmation, floor no-show management, and operational hygiene on the backend.

---

## What It Does

### Smart Reservations & Concurrency Protection ⚡
Users can book tables in real time across multiple restaurants with flexible scheduling (lunch, high tea, prime dinner, or custom minute selection) and standard Indian mobile formatting (`🇮🇳 +91`). During high-traffic booking surges, an atomic table allocation loop backed by MongoDB compound unique indexes (`restaurant`, `date`, `time`, `tableNumber`) strictly prevents race conditions and overbooking. Past dates and times are rejected automatically, and a 3-active-reservation cap prevents spam. The entire booking journey is unified into a production-grade `/reservation` engine.

### Automated WhatsApp Reconfirmation & Two-Way Webhook 📲
To eliminate the classic industry "no-show" problem without demanding friction-heavy upfront credit card deposits, a background worker runs every 15 minutes checking for bookings coming up in the next 2 hours. It dispatches interactive WhatsApp confirmation prompts. A dedicated two-way webhook (`POST /webhook/whatsapp`) listens for customer responses:
* **Reply 1 or CONFIRM:** Confirms patron arrival status in real time.
* **Reply 2 or CANCEL:** Automatically cancels the booking with zero penalty and immediately releases the table back into the available pool for walk-in or waitlisted diners!

### Luxury Newsletter & Welcome Privilege Dispatch ✉️
Guests can subscribe to the Reservia culinary circle directly from the footer. Built with a dual-dispatch cloud architecture:
* **EmailJS Browser SDK + HTTPS REST API:** Bypasses cloud egress firewall restrictions (such as Render Free Tier SMTP port blocks) by transmitting over HTTPS (Port 443).
* **Automated Welcome Email:** Instantly triggers an authentic confirmation and fine-dining welcome invitation directly from `driksha605@gmail.com`.
* **Database Persistence:** Subscriptions are validated and stored in MongoDB under the `Subscriber` collection.

### AI Sommelier & Culinary Concierge 🍷
An intelligent, glassmorphic floating concierge widget available across all pages (`views/includes/ai-concierge.ejs`):
* **Bespoke Wine Pairings:** Recommends Old & New World vintages (Barolo, Burgundy Pinot Noir, Chablis, Napa Valley Cabernet) tailored to cuts of meat, seafood, and artisanal pasta.
* **Celebration & Itinerary Planning:** Plans romantic 3-course anniversary dinners with candlelit alcove booth placement and champagne welcomes.
* **Dietary & Allergen Guidance:** Curates plant-based tasting menus and gluten-sensitive dining options with kitchen cross-contamination protocols.
* **Zero-Key Guaranteed Execution:** Powered by a built-in hospitality knowledge engine with seamless optional LLM enhancement via `POST /api/ai/concierge`.

### Role-Based Admin Command Center & Floor Operations 📊
Admins get a dedicated B2B operations dashboard (`/admin`) to monitor business vitals in real time — total registered users, overall booking volume, live-calculated revenue (per guest cover), and latest reservation telemetry. Managers have direct floor controls:
* **Seat Guest:** Instantly updates booking to completed upon arrival.
* **Mark No-Show:** Enforces the 15-minute grace period policy; if a patron doesn't show, the manager marks them as `No-Show`, instantly freeing the table slot in the database.
* **📲 Ping:** Manually triggers on-demand WhatsApp confirmation pings.

### Automated Data Hygiene (Cron Worker) ⏱️
A background cron service (`node-cron`) sweeps expired reservations and transitions them from `"Reserved"` to `"Completed"`, eliminating manual record updates for restaurant staff.

### Reviews & Community Feedback ⭐
Guests can share dining feedback with star ratings, browse customer experiences, edit or delete their reviews, and like feedback in real time.

### Security & Session Integrity 🛡️
Built with zero shortcuts: brute-force mitigation on auth routes via `express-rate-limit`, strict IDOR (Insecure Direct Object Reference) protection ensuring users can only manage their own bookings, input sanitization via `express-validator`, BCrypt password hashing, Helmet HTTP security headers, and persistent 24-hour session storage via `connect-mongo`.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Backend** | Node.js (ES6+), Express 5, Mongoose (ODM), node-cron |
| **Frontend** | EJS (Embedded JavaScript Templates), Vanilla JavaScript, CSS3 |
| **Database** | MongoDB Atlas & Connect-Mongo (persistent session store) |
| **Messaging & Notifications**| WhatsApp Cloud API / Webhook & EmailJS / Nodemailer (HTTPS & SMTP dual-engine) |
| **Security & Auth** | Express Session, BCrypt, Helmet, Express Rate Limit, Express Validator |
| **Testing & CI** | Jest, Supertest, MongoMemoryServer, GitHub Actions CI |
| **Hosting** | Render (Web Service) · MongoDB Atlas (Cloud Database) |

---

## How It's Built

```
┌──────────────────┐          HTTPS           ┌──────────────────────┐      Mongoose      ┌──────────────────┐
│   Client UI      │ ←──────────────────────→ │   Express 5 Server   │ ←────────────────→ │  MongoDB Atlas   │
│  (EJS / CSS)     │   Cookie-Based Session   │   (Render Web Svc)   │   Connection Pool  │ (Cloud Database) │
└──────────────────┘                          └──────────────────────┘                    └──────────────────┘
         │                                               │
         ▼                               ┌───────────────┴───────────────┐
   EmailJS Dispatch                      ▼                               ▼
(Client HTTPS Engine)           node-cron Schedulers           POST /webhook/whatsapp
                            (Hourly Expiration Sweeps &      (Two-Way Reconfirm / Cancel
                            15-Min WhatsApp Reminders)        Instant Table Release)
```

The frontend is rendered server-side with custom EJS templates and styled with a luxury dark-theme aesthetic. Authentication and session state are managed via cryptographically signed HTTP cookies tied directly to a persistent MongoDB session store (`connect-mongo`). 

Incoming requests pass through a security middleware pipeline (Helmet headers, rate limiters, input sanitization, and authentication bouncers) before reaching route handlers. Table reservations utilize an atomic allocation retry loop backed by compound database indexes to guarantee zero race-condition overbooking under concurrent traffic.

### Backend Structure:
```
Reservia/
├── models/               # Mongoose schemas & compound indexes
│   ├── login.js          # User schema with BCrypt pre-save hooks & roles
│   ├── reservation.js    # Reservation schema with unique slot indexes & confirmation state
│   ├── subscriber.js     # Newsletter subscriber schema & registration timestamp
│   └── review.js         # Guest feedback & ratings schema
├── views/                # EJS templates (Luxury dark-theme interface)
│   ├── index.ejs         # Hero landing page & dining highlights
│   ├── admin.ejs         # Live analytics, telemetry & floor action dashboard
│   ├── reservation.ejs   # Flexible table booking form with +91 Indian format & timepicker
│   ├── order.ejs         # User booking history & active reservation tracker
│   ├── reviews.ejs       # Community review feed
│   └── ...
├── public/               # Static assets (CSS stylesheets, images, client scripts)
├── scripts/              # Performance & stress-testing tools
│   └── test-concurrency.js  # Concurrent booking storm simulator
├── test/                 # Automated test suite (Jest + Supertest + in-memory Mongo)
│   ├── auth.test.js      # Registration, login & rate limiting tests
│   ├── booking.test.js   # Reservation lifecycle & IDOR protection tests
│   ├── concurrency.test.js # Race-condition & capacity overload tests
│   ├── roles.test.js     # RBAC & admin route authorization tests
│   └── setup.js          # In-memory MongoDB testing environment
├── .github/              # GitHub Actions CI workflow definitions
└── server.js             # Core Express application, routing, webhooks & cron services
```

---

## API Overview

| Method | Endpoint | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/home` | Luxury dining landing page | Public |
| `GET` | `/explore` | Curated dining atmosphere & restaurant showcase | Public |
| `GET` | `/about` | Culinary story and kitchen heritage | Public |
| `GET` | `/contact` | Concierge & guest inquiry form | Public |
| `POST` | `/subscribe` | Newsletter signup & welcome email dispatch (Dual EmailJS/Nodemailer) | Public |
| `POST` | `/api/ai/concierge` | AI Sommelier & fine-dining virtual concierge assistant | Public |
| `POST` | `/sign-up` | Registers new user with input validation & BCrypt hashing | Public (Rate Limited) |
| `POST` | `/login` | Authenticates user credentials & creates Mongo session | Public (Rate Limited) |
| `GET` | `/logout` | Destroys active session & clears cookies | Authenticated |
| `GET` | `/reservation` | Displays table reservation interface (flexible timepicker & +91 support) | Authenticated |
| `POST` | `/reservation` | Books table with atomic race-condition protection | Authenticated |
| `GET` | `/order` | View user's active and past reservations | Authenticated |
| `PUT` | `/reservation/:id` | Update booking details (IDOR protected) | Authenticated |
| `DELETE` | `/reservation/:id` | Cancel/delete reservation (IDOR protected) | Authenticated |
| `GET` | `/profile` | User profile, booking count & review stats | Authenticated |
| `PUT` | `/profile/password` | Change password with current password verification | Authenticated |
| `GET` | `/reviews` | Browse community dining reviews & ratings | Public |
| `POST` | `/reviews/add` | Submit dining feedback & rating | Public |
| `PUT` | `/reviews/:id/like` | Increment like counter on a review | Public |
| `PUT` | `/reviews/:id` | Edit review content | Public |
| `DELETE` | `/reviews/:id` | Remove a review | Public |
| `GET` | `/admin` | Real-time analytics, revenue metrics & booking table | Admin Only |
| `POST` | `/admin/reservation/:id/status` | Floor action: Seat guest or mark No-Show (instantly frees table) | Admin Only |
| `POST` | `/admin/reservation/:id/ping-whatsapp` | Manually dispatch WhatsApp confirmation message | Admin Only |
| `POST` | `/webhook/whatsapp` | Webhook: Processes guest reply (1=Confirm, 2=Cancel & Free Table) | Webhook / Public |
| `GET` | `/make-me-admin` | Demo helper to grant admin privileges to current session | Authenticated |
| `GET` | `/test-cron` | Manually trigger reservation auto-completion job | Admin Only |

---

## Run Locally

### Prerequisites
* Node.js 18+
* npm
* MongoDB (local instance or MongoDB Atlas connection string)

### 1. Clone & Install
```bash
git clone https://github.com/drikshathakur786/Reservia.git
cd Reservia
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
MONGO_URL=your_mongodb_connection_string
SESSION_SECRET=your_super_secret_session_key
PORT=8080
MAX_TABLES_PER_SLOT=20
```

### 3. Run the Server
```bash
npm start
```
*App will be running at `http://localhost:8080/home`*

### 4. Run Automated Tests
```bash
# Run all unit & integration tests
npm test

# Run race-condition & concurrency tests
npm run test:concurrency

# Run standalone booking storm stress test
npm run stress-test
```

---

## License

This project is licensed under the [MIT License](https://github.com/drikshathakur786/Reservia/blob/main/LICENSE).
