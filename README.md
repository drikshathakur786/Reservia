# ✦ Reservia

[![Live Demo]](https://reservia-x130.onrender.com)

A production-ready restaurant management platform designed to deliver a luxury booking experience for customers while providing a secure, automated command center for administrators. 

---

## ✨ What It Does

* **Smart Reservations:** Users can book tables in real-time. The backend actively prevents race-conditions and overbooking during high-traffic surges.
* **Role-Based Admin Dashboard:** A secure B2B command center for restaurant staff to track revenue, total users, and active bookings.
* **Automated Data Hygiene:** Server-side cron jobs run silently in the background to automatically transition expired reservations from "Reserved" to "Completed".
* **Spam & Security Protection:** Hardened with rate-limiting, strict max-booking caps per user, and XSS sanitization.
* **Luxury Aesthetic:** A fully custom, dark-theme UI built with EJS and CSS3.

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js (v5)
* **Database:** MongoDB Atlas (Mongoose) & Connect-Mongo (Sessions)
* **Frontend:** EJS Templating, Vanilla JS, Custom CSS
* **Deployment:** Hosted live on Render

## 🚀 Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/drikshathakur786/Reservia.git
   cd Reservia
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URL=your_mongodb_connection_string
   SESSION_SECRET=your_secret_key
   PORT=8080
   ```

3. **Run the Server**
   ```bash
   npm start
   ```
   *Your app will be running at `http://localhost:8080`*

## 📡 API Overview

| Method | Endpoint | Description | Access Requirement |
|--------|----------|-------------|--------------------|
| `GET`  | `/home` | Renders the luxury landing page | Public |
| `POST` | `/signup` | Registers a new user with bcrypt hashing | Public |
| `POST` | `/login` | Authenticates user & creates Mongo session | Public |
| `POST` | `/reservation` | Submits a booking (with capacity limits) | Authenticated User |
| `GET`  | `/order` | Fetches the user's active/past bookings | Authenticated User |
| `DELETE`| `/delete-order/:id` | Securely cancels a booking (IDOR protected) | Authenticated User |
| `GET`  | `/admin` | Displays the revenue & management dashboard | Admin Only |
