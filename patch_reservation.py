import re

with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'r') as f:
    content = f.read()

old_block = """app.post("/reservation", requireAuth, async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'];
    try {
        const { restaurant, date, time } = req.body;

        // Concurrent booking check — count existing bookings for this slot
        const existingCount = await Reservation.countDocuments({ restaurant, date, time });

        if (existingCount >= MAX_TABLES_PER_SLOT) {
            // Fully booked — return user to reservation form with an error
            return res.render("reservation", {
                images,
                error: `Sorry! ${restaurant} is fully booked for ${time} on ${date}. Please choose a different time or date.`
            });
        }

        // Slot available — save the reservation
        const reservationData = { ...req.body, userId: req.session.userId };
        const reservation = new Reservation(reservationData);
        await reservation.save();
        res.redirect("/order?success=Reservation confirmed!");
    } catch (err) {
        console.error("Reservation error:", err);
        res.status(500).send("Failed to make reservation.");
    }
});"""

new_block = """app.post("/reservation", requireAuth, async (req, res) => {
    const images = ['assets/images/HomePageImages/logo.png', 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c'];
    try {
        const { restaurant, date, time, guests } = req.body;
        
        // 1. PRODUCTION CHECK: Prevent past dates (backend validation)
        const selectedDate = new Date(date + 'T' + time);
        if (selectedDate < new Date()) {
            return res.render("reservation", { images, error: "Cannot book a table in the past." });
        }
        
        // 2. PRODUCTION CHECK: Validate inputs
        if (!restaurant || !date || !time || guests < 1) {
            return res.render("reservation", { images, error: "Invalid booking details." });
        }

        // 3. PRODUCTION CHECK: User Spam Prevention (max 3 active bookings per user)
        const userBookings = await Reservation.countDocuments({ userId: req.session.userId, date: { $gte: new Date().toISOString().split('T')[0] } });
        if (userBookings >= 3) {
            return res.render("reservation", { images, error: "You cannot have more than 3 active reservations at a time." });
        }

        // 4. PRODUCTION CHECK: Concurrent Capacity Check
        const existingCount = await Reservation.countDocuments({ restaurant, date, time });
        if (existingCount >= MAX_TABLES_PER_SLOT) {
            return res.render("reservation", {
                images,
                error: `Sorry! ${restaurant} is fully booked for ${time}. Please choose a different time or date.`
            });
        }

        // 5. SUCCESS: Save reservation
        const reservationData = { ...req.body, userId: req.session.userId };
        const reservation = new Reservation(reservationData);
        await reservation.save();
        res.redirect("/order?success=Reservation confirmed!");
    } catch (err) {
        console.error("Reservation error:", err);
        res.status(500).send("Failed to make reservation.");
    }
});"""

content = content.replace(old_block, new_block)

with open('/Users/drikshathakur/Desktop/Reservia/server.js', 'w') as f:
    f.write(content)

print("Reservation POST patched successfully.")
