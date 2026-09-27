# ✦ Reservia | Fine Dining Management System

[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Website-c8a97e?style=for-the-badge)](https://reservia-x130.onrender.com)

> **A production-grade, full-stack application bridging a luxury B2C customer experience with robust B2B backend management.**

Built with a focus on **security, concurrency, and automated workflows**—going beyond the standard CRUD app to solve real-world business challenges.

---

## 🚀 The "Why" (For Recruiters & Hiring Managers)
In today's competitive tech landscape, I wanted to build an application that proves I think like a **Production Engineer**. Reservia doesn't just take bookings; it actively prevents race-conditions during high traffic, defends against XSS/Bot attacks, and automates its own database maintenance without human intervention.

## 💎 Key Engineering Features
* **Concurrency Safeguards:** Strict backend capacity validation prevents overbooking even if multiple users try to reserve the final table at the exact same millisecond.
* **Role-Based Access Control (RBAC):** Secure separation between `User` and `Admin` accounts. Features a protected B2B Command Center for administrators to track revenue, occupancy, and KPIs.
* **Automated Cron Jobs:** Server-side background tasks automatically sweep the database every hour to update expired reservations, ensuring data hygiene.
* **Enterprise Security:** Hardened with `express-rate-limit` (brute-force defense), `helmet` (HTTP headers), strict input validation, and XSS sanitization.
* **Luxury UI/UX:** A custom-designed, fully responsive dark-theme interface with fluid animations, built from scratch to reflect high-end branding.

## 🛠 Tech Stack
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Mongoose) + Connect-Mongo for secure session storage
* **Frontend:** EJS (Embedded JavaScript), Vanilla JS, Custom CSS3
* **DevOps/Deployment:** Hosted on **Render** with automated GitHub CI/CD

---

## 🏃‍♂️ Run it Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/drikshathakur786/Reservia.git
   cd Reservia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add:
   ```env
   MONGO_URL=your_mongodb_connection_string
   SESSION_SECRET=your_secret_key
   PORT=8080
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   *Visit `http://localhost:8080` in your browser.*
