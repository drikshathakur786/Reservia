```text
  _____                              _       
 |  __ \                            (_)      
 | |__) |___  ___  ___ _ ____   _ _  _  __ _ 
 |  _  // _ \/ __|/ _ \ '__\ \ / / | |/ _` |
 | | \ \  __/\__ \  __/ |   \ V /| | | (_| |
 |_|  \_\___||___/\___|_|    \_/ |_|_|\__,_|
                                             
```

[![Live Deployment](https://img.shields.io/badge/Status-LIVE_ON_RENDER-10B981?style=for-the-badge&logo=render)](https://reservia-x130.onrender.com)

Most restaurant booking projects on GitHub are just glorified to-do lists. You fill out a form, it saves to a database, and that's it. 

I built **Reservia** because I wanted to see what happens when you treat a simple booking system like a high-stakes production environment. 

### The Engineering Challenges (And How I Solved Them)

If you're a recruiter or hiring manager looking at this code, here is what actually matters under the hood:

**1. The "Double-Booking" Problem**
What happens if a restaurant only has 20 tables, but 5 different users click "Book" at the exact same millisecond for the final table? 
* **The Fix:** I implemented backend capacity locks using MongoDB's `countDocuments` evaluated asynchronously before saving. If you're user #21, the server rejects the request. No race-condition overbookings.

**2. The "Ghost Town" Problem**
How does a restaurant know which tables are currently active vs. past reservations without manually clicking "done" 50 times a day?
* **The Fix:** I wrote a server-side `node-cron` background job. Every hour, on the hour, the server wakes up, scans the database for expired time slots, and automatically transitions them from "Reserved" to "Completed". 

**3. The "Troll" Problem**
What stops a malicious bot (or a rival restaurant) from creating a script that books all your tables and bankrupts the business?
* **The Fix:** Express rate-limiting at the network level, combined with a strict database rule: one account can only hold a maximum of 3 active reservations at any given time.

**4. The "B2B" Problem**
A restaurant app isn't just for hungry customers; it's for the restaurant owner. 
* **The Fix:** Built-in Role-Based Access Control (RBAC). If your database role is `Admin`, the UI dynamically unlocks a hidden Command Center dashboard calculating real-time revenue and occupancy metrics. 

### The Stack
No massive bloated frameworks. Just clean, fast, server-rendered code.
* **Brain:** Node.js & Express.js
* **Memory:** MongoDB Atlas (Mongoose) + Connect-Mongo for HTTP-only sessions
* **Face:** EJS, Vanilla JS, and a custom dark-luxury CSS design system
* **Armor:** Helmet.js, Bcrypt, and Express-Rate-Limit

---

### Spin it up locally

```bash
# 1. Grab the code
git clone https://github.com/drikshathakur786/Reservia.git

# 2. Install the gears
cd Reservia && npm install

# 3. Give it the keys
# Create a .env file and add your MONGO_URL, SESSION_SECRET, and PORT=8080

# 4. Ignite
npm start
```
