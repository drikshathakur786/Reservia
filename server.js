// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const cron = require("node-cron");
const app = express();

// Security: Set secure HTTP headers
app.use(helmet({ contentSecurityPolicy: false }));

// Logger
const morgan = require('morgan');
app.use(morgan('dev'));

// To load web-pages faster
const compression = require('compression');
app.use(compression());

// Models
const User = require("./models/login");
const Reservation = require("./models/reservation");
const Review = require("./models/review");
const SlotCounter = require("./models/slotCounter");


// Background Task: Auto-complete past reservations every hour (disabled during test runs)
if (process.env.NODE_ENV !== 'test') {
    cron.schedule('0 * * * *', async () => {
        console.log('Running cron job: Marking past reservations as Completed');
        try {
            const now = new Date();
            const pastReservations = await Reservation.find({ status: 'Reserved' });
            
            for (let res of pastReservations) {
                const resDate = new Date(`${res.date}T${res.time}`);
                if (resDate < now) {
                    res.status = 'Completed';
                    await res.save();
                }
            }
        } catch (err) {
            console.error('Cron Error:', err);
        }
    });
}





// MongoDB connection
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGO_URL)
      .then(() => {
        console.log("MongoDB connected");
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1); // Stop server if DB fails
      });
}


// App config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session config
const sessionConfig = {
    secret: process.env.SESSION_SECRET || "reservia_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // Session lasts 24 hours
};

// Only use MongoStore in production — tests use in-memory store (no MONGO_URL needed)
if (process.env.NODE_ENV !== 'test') {
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URL });
}

app.use(session(sessionConfig));


// Make session data available to all EJS templates
app.use((req, res, next) => {
    res.locals.userId = req.session.userId || null;
    res.locals.userRole = req.session.role || null;
    next();
});

// Rate limiter: max 10 login/signup attempts per 15 mins per IP (bypassed in test environment)
const rateLimiterMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many attempts from this IP. Please try again after 15 minutes."
});

const authLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        return next();
    }
    return rateLimiterMiddleware(req, res, next);
};


// Middleware for Admin access
const requireAdmin = async (req, res, next) => {
    if (!req.session.userId) return res.redirect('/login');
    const user = await User.findById(req.session.userId);
    if (!user || user.role !== 'admin') {
        return res.status(403).send("<h1>403 Forbidden: Admins Only</h1><a href='/home'>Go Home</a>");
    }
    next();
};

// Secret route to elevate current user to admin (for portfolio demonstration)
app.get("/make-me-admin", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    await User.findByIdAndUpdate(req.session.userId, { role: 'admin' });
    req.session.role = 'admin'; // Fix: Force session update so navbar immediately shows Dashboard
    req.session.save(() => {
        res.redirect("/admin");
    });
});


// Secret route to manually trigger the Cron Job for testing
app.get("/test-cron", requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const pastReservations = await Reservation.find({ status: 'Reserved' });
        let updatedCount = 0;
        for (let res of pastReservations) {
            const resDate = new Date(`${res.date}T${res.time}`);
            if (resDate < now) {
                res.status = 'Completed';
                await res.save();
                updatedCount++;
            }
        }
        res.send(`<h1>Cron Job Triggered Successfully!</h1><p>${updatedCount} past reservations were automatically marked as 'Completed'.</p><a href='/admin'>Go back to Dashboard</a>`);
    } catch (err) {
        res.status(500).send("Cron trigger failed");
    }
});

// Admin Dashboard Route
app.get("/admin", requireAdmin, async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    try {
        const totalUsers = await User.countDocuments();
        const totalReservations = await Reservation.countDocuments();
        
        // Calculate estimated revenue
        const allRes = await Reservation.find();
        let totalRevenue = 0;
        allRes.forEach(r => {
            totalRevenue += ((r.guests || 1) * 500); // 500 INR per guest
        });

        // Get recent bookings
        const recentReservations = await Reservation.find()
            .sort({ createdAt: -1 })
            .limit(15);

        res.render("admin", { 
            images, 
            totalUsers, 
            totalReservations, 
            totalRevenue,
            recentReservations
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Admin Error");
    }
});

// Home route
app.get(['/', '/home'], (req, res) => {
    const images = [
       'assets/images/HomePageImages/logo.png',
      "assets/images/HomePageImages/hero-slider-1.jpg",
      "assets/images/HomePageImages/hero-slider-2.jpg",
      "assets/images/HomePageImages/hero-slider-3.jpg",
      "assets/images/HomePageImages/about-banner.jpg",
      "assets/images/HomePageImages/about-abs-image.jpg",
      "assets/images/HomePageImages/about-abs-image.jpg",
      "assets/images/HomePageImages/intimate_dining.jpg",
      "assets/images/HomePageImages/ro_dinning.jpg",
      "assets/images/HomePageImages/family_dinning.jpg",
      "assets/images/HomePageImages/outdoor_dinning.jpg",
      "assets/images/HomePageImages/custom_ambiance.jpg",
      "assets/images/HomePageImages/wine_dinning.jpg",
      "assets/images/HomePageImages/shape-5.png",
      "assets/images/HomePageImages/shape-6.png",
      "assets/images/HomePageImages/features-icon-1.png",
      "assets/images/HomePageImages/features-icon-2.png",
      "assets/images/HomePageImages/features-icon-3.png",
      "assets/images/HomePageImages/features-icon-4.png",
      "assets/images/HomePageImages/event-1.jpg",
      "https://images.pexels.com/photos/225228/pexels-photo-225228.jpeg?auto=compress&cs=tinysrgb&w=600",
      "assets/images/HomePageImages/event-3.jpg"
  ];
    const success = req.query.success ? String(req.query.success).substring(0, 100) : null;
    res.render('index', { images, success });
});

/// About route
app.get("/about", (req, res) => {
    const images = [
        'assets/images/HomePageImages/logo.png',
        'assets/videos/AboutUsBackground1.mp4',
        'assets/videos/AboutUsBackground1.webm',
        'assets/images/chef1.jpg',
        'assets/images/dining1.jpg',
        'assets/images/kitchen1.jpg'
    ];
    res.render("aboutUs", { images });
});

// Contact route
app.get("/contact", (req, res) => {
    const images = [
        'assets/images/HomePageImages/logo.png',
        'assets/images/logo.png',
        'assets/images/yay1.jpg'
    ];
    res.render("contact", { images });
});

// Explore route
app.get('/explore', (req, res) => {
    const images = [
        'assets/images/HomePageImages/logo.png',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9',
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
        'https://images.unsplash.com/photo-1585937421612-70a008356fbe',
        'https://images.unsplash.com/photo-1552566626-52f8b828add9',
        'https://images.unsplash.com/photo-1544148103-0773bf10d330',
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47',
        'https://images.unsplash.com/photo-1532347922424-c652d9b7208e',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'
    ];
    res.render('explore', { images });
});
// Middleware to protect routes (Our Bouncer)
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

// Reservation GET (show form)
app.get("/reservation", requireAuth, (req, res) => {
    const images = [
        'assets/images/HomePageImages/logo.png',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'
    ];
    res.render("reservation", { images, error: null });
});

// Reservation POST (handle form) — with atomic concurrent booking protection
const MAX_TABLES_PER_SLOT = process.env.MAX_TABLES_PER_SLOT ? parseInt(process.env.MAX_TABLES_PER_SLOT) : 20;

app.post("/reservation", requireAuth, async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'];
    try {
        const { restaurant, date, time, guests } = req.body;
        
        // 1. PRODUCTION CHECK: Prevent past dates (backend validation)
        const selectedDate = new Date(date + 'T' + time);
        const now = new Date();
        // Allow same-day dates, but reject past timestamps
        if (isNaN(selectedDate.getTime()) || selectedDate < new Date(now.getTime() - 60000)) {
            return res.status(400).render("reservation", { images, error: "Cannot book a table in the past." });
        }
        
        // 2. PRODUCTION CHECK: Validate inputs
        if (!restaurant || !date || !time || !guests || Number(guests) < 1) {
            return res.status(400).render("reservation", { images, error: "Invalid booking details." });
        }

        // 3. PRODUCTION CHECK: User Spam Prevention (max 3 active bookings per user)
        const todayStr = new Date().toISOString().split('T')[0];
        const userBookings = await Reservation.countDocuments({ 
            userId: req.session.userId, 
            date: { $gte: todayStr },
            status: { $ne: 'Cancelled' }
        });
        if (userBookings >= 3) {
            return res.status(400).render("reservation", { images, error: "You cannot have more than 3 active reservations at a time." });
        }

        // 4. PRODUCTION CHECK: Concurrency-Safe Atomic Slot Counter
        const activeSlotLimit = process.env.MAX_TABLES_PER_SLOT ? parseInt(process.env.MAX_TABLES_PER_SLOT) : MAX_TABLES_PER_SLOT;
        const slotKey = `${restaurant}::${date}::${time}`;

        // Atomically increment the counter for this slot
        const counter = await SlotCounter.findOneAndUpdate(
            { key: slotKey },
            { $inc: { count: 1 } },
            { new: true, upsert: true }
        );

        // If we exceeded the limit, revert the increment and reject
        if (counter.count > activeSlotLimit) {
            await SlotCounter.updateOne({ key: slotKey }, { $inc: { count: -1 } });
            return res.status(400).render("reservation", {
                images,
                error: `Sorry! ${restaurant} is fully booked for ${time}. Please choose a different time or date.`
            });
        }

        const assignedTable = counter.count;

        // 5. Save the reservation
        const reservationData = { 
            ...req.body, 
            userId: req.session.userId,
            tableNumber: assignedTable,
            guests: Number(guests)
        };
        const reservation = new Reservation(reservationData);
        await reservation.save();

        return res.redirect("/order?success=Reservation confirmed!");
    } catch (err) {
        console.error("Reservation error:", err);
        return res.status(500).send("Failed to make reservation.");
    }
});


// Order (get reservations)
app.get('/order', requireAuth, async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    try {
        // Fix: ONLY find reservations that belong to this specific user!
        const reservationData = await Reservation.find({ userId: req.session.userId });
        const orders = reservationData.map(reservation => ({
            orderId: reservation._id,
            orderEmail: reservation.email,
            orderDate: reservation.date,
            items: [
                { name: `Reservation By:${reservation.name} @ ${reservation.restaurant}`, quantity: 1 },
                { name: 'Table Reservation', quantity: reservation.guests },
                { name: `Time: ${reservation.time}`, quantity: 1 },
                { name: `Ambiance: ${reservation.music}`, quantity: 1 },
                ...(reservation.requests ? [{ name: `Special Request: ${reservation.requests}`, quantity: 1 }] : [])
            ],
            totalAmount: reservation.guests * 500,
            status: 'Reserved'
        }));
        res.render("order", { images, orders });
    } catch (err) {
        console.error("Order error:", err);
        res.render("order", { images, orders: [] });
    }
});

// Reservation DELETE
app.delete("/reservation/:id", requireAuth, async (req, res) => {
    try {
        // Fix: Ensure the user deleting it actually owns it
        const reservation = await Reservation.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
        if (!reservation) return res.status(403).json({ message: "Unauthorized or not found." });
        res.json({ message: "Reservation deleted successfully." });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Failed to delete reservation." });
    }
});

// Reservation UPDATE
app.put("/reservation/:id", requireAuth, async (req, res) => {
    try {
        // Fix: Ensure the user updating it actually owns it
        const reservation = await Reservation.findOneAndUpdate({ _id: req.params.id, userId: req.session.userId }, req.body);
        if (!reservation) return res.status(403).json({ message: "Unauthorized or not found." });
        res.json({ message: "Reservation updated successfully." });
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ message: "Failed to update reservation." });
    }
});

// Feedback GET
app.get("/feedback", (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    res.render("feedback", { images });
});

// Feedback POST
app.post("/feedback", async (req, res) => {
    try {
        const newReview = new Review({
            name: req.body.name,
            email: req.body.email,
            feedback: req.body.feedback,
            rating: req.body.rating,
            timestamp: new Date()
        });
        await newReview.save();
        res.redirect("/reviews");
    } catch (err) {
        console.error("Feedback error:", err);
        res.status(500).send("Failed to submit feedback.");
    }
});

// Reviews GET
app.get("/reviews", async (req, res) => {
    try {
        const reviews = await Review.find().sort({ timestamp: -1 });
        const images = ['assets/images/HomePageImages/logo.png'];
        res.render("reviews", { images, reviews });
    } catch (err) {
        console.error("Review fetch error:", err);
        res.render("reviews", { images: [], reviews: [] });
    }
});


app.post("/reviews/add", async (req, res) => {
    try {
        const { name, email, rating, feedback } = req.body;

        const newReview = new Review({
            name,
            email,
            rating: parseInt(rating), // ensure it's a number
            feedback
        });

        await newReview.save();
        res.redirect("/reviews");
    } catch (err) {
        console.error("Review submission error:", err);
        res.status(500).send("Error saving review");
    }
});


// Like review
app.put("/reviews/:id/like", async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        review.likes = (review.likes || 0) + 1;
        await review.save();
        res.json({ success: true });
    } catch (err) {
        console.error("Like error:", err);
        res.status(500).json({ success: false });
    }
});

// Edit review
app.put("/reviews/:id", async (req, res) => {
    try {
        const { name, email, feedback, rating } = req.body;
        await Review.findByIdAndUpdate(req.params.id, { name, email, feedback, rating });
        res.json({ success: true });
    } catch (err) {
        console.error("Edit error:", err);
        res.status(500).json({ success: false });
    }
});

// Delete review
app.delete("/reviews/:id", async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ success: false });
    }
});

// Payment routes
app.get('/process-payment', (req, res) => {
    res.render('thankyou');
});

app.get("/payment", (req, res) => {
    const images = [
        'assets/images/HomePageImages/logo.png',
        'assets/images/mc.png',
        'assets/images/vi.png',
        'assets/images/pp.png'
    ];
    res.render("payment", { images });
});

app.get("/tracking", (req, res) => {
    res.redirect("/order");
});

// Profile GET
app.get("/profile", requireAuth, async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    try {
        const user = await User.findById(req.session.userId).select("-password");
        const reservationCount = await Reservation.countDocuments({ userId: req.session.userId });
        const reviewCount = await Review.countDocuments({ email: user.email });
        res.render("profile", { images, user, reservationCount, reviewCount });
    } catch (err) {
        console.error("Profile error:", err);
        res.redirect("/home");
    }
});

// Profile — change password
app.put("/profile/password", requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.session.userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }
        user.password = newPassword; // model's pre-save hook will hash it
        await user.save();
        res.json({ success: true });
    } catch (err) {
        console.error("Password change error:", err);
        res.status(500).json({ message: "Something went wrong." });
    }
});

// Auth GET
app.get("/login", (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    res.render("login", { images, message: undefined, errors: [] });
});

app.get("/sign-up", (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    res.render("signUp", { images, errors: [] });
});

// Auth POST — with rate limiter + input validation
app.post("/sign-up", authLimiter, [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().normalizeEmail().withMessage("Please enter a valid email."),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ message: "Email already registered!", redirect: "/login" });
        }
        const newUser = new User({ name, email, password });
        await newUser.save();
        res.json({ message: "Signup successful! Please log in.", redirect: "/login" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

app.post("/login", authLimiter, [
    body("username").isEmail().normalizeEmail().withMessage("Please enter a valid email."),
    body("password").notEmpty().withMessage("Password is required.")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("login", {
            images: ['assets/images/HomePageImages/logo.png'],
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }

    const { username, password } = req.body;
    try {
        const user = await User.findOne({ email: username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("login", {
                images: ['assets/images/HomePageImages/logo.png'],
                message: "Invalid email or password!",
                errors: []
            });
        }
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.role = user.role;
        res.redirect("/home?success=Login successful!");
    } catch (err) {
        console.error(err);
        res.status(500).render("login", {
            images: ['assets/images/HomePageImages/logo.png'],
            message: "Something went wrong. Please try again later.",
            errors: []
        });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/home");
});

// 404 handler — must be last
app.use((req, res) => {
    res.status(404).render("index", {
        images: ['assets/images/HomePageImages/logo.png'],
        success: null
    });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/home`);
    });
}

module.exports = app;

