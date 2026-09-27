with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'r') as f:
    content = f.read()

# Add node-cron import
content = content.replace(
    'const { body, validationResult } = require("express-validator");',
    'const { body, validationResult } = require("express-validator");\nconst cron = require("node-cron");'
)

# Add cron job and admin routes after the models import
insert_after = 'const Review = require("./models/review");'

new_code = """
// Background Task: Auto-complete past reservations every hour
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
    if (!req.session.userId) return res.redirect('/login');
    await User.findByIdAndUpdate(req.session.userId, { role: 'admin' });
    res.redirect("/admin");
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
"""

content = content.replace(insert_after, insert_after + "\n" + new_code)

with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'w') as f:
    f.write(content)

print("Server updated with Cron and Admin routes!")
