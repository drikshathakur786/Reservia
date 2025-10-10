// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const app = express();


// two 3rd party middlewares
// logger
const morgan = require('morgan');
app.use(morgan('dev'));

// to load web-pages faster
const compression = require('compression');
app.use(compression());

// Models
const User = require("./models/login");
const Reservation = require("./models/reservation");
const Review = require("./models/review");

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
  });


// App config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    const success = req.query.success;
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
// Reservation GET (show form)
app.get("/reservation", (req, res) => {
    const images = [
        'assets/images/HomePageImages/logo.png',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'
    ];
    res.render("reservation", { images });
});

// Reservation POST (handle form)
app.post("/reservation", async (req, res) => {
    try {
        const reservation = new Reservation(req.body);
        await reservation.save();
        res.redirect("/order");
    } catch (err) {
        console.error("Reservation error:", err);
        res.status(500).send("Failed to make reservation.");
    }
});

// Order (get reservations)
app.get('/order', async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    try {
        const reservationData = await Reservation.find({});
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
app.delete("/reservation/:id", async (req, res) => {
    try {
        await Reservation.findByIdAndDelete(req.params.id);
        res.json({ message: "Reservation deleted successfully." });
    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ message: "Failed to delete reservation." });
    }
});

// Reservation UPDATE
app.put("/reservation/:id", async (req, res) => {
    try {
        await Reservation.findByIdAndUpdate(req.params.id, req.body);
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
    const images = ['assets/images/HomePageImages/logo.png'];
    res.render("tracking", { images });
});

// Auth GET
app.get("/login", (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    res.render("login", { images, message: undefined, redirect: undefined });
});

app.get("/sign-up", (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png'];
    res.render("signUp", { images });
});

// Auth POST
app.post("/sign-up", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({ message: "Email already registered!", redirect: "/login" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.json({ message: "Signup successful! Please log in.", redirect: "/login" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error. Please try again." });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ email: username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render("login", {
                images: ['assets/images/HomePageImages/logo.png'],
                message: "Invalid email or password!",
                redirect: "/login"
            });
        }

        res.redirect("/home?success=Login successful!");
    } catch (err) {
        console.error(err);
        res.status(500).render("login", {
            images: ['assets/images/HomePageImages/logo.png'],
            message: "Something went wrong. Please try again later.",
            redirect: "/login"
        });
    }
});

// Start server
app.listen(8080, () => {
    console.log("Server running at http://localhost:8080/home");
});
