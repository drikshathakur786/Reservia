const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: String, required: true },
    name: String,
    email: String,
    date: { type: String, required: true },
    time: { type: String, required: true },
    tableNumber: { type: Number, required: true, default: 1 },
    guests: Number,
    music: String,
    requests: String,
    status: { type: String, default: 'Reserved' }, // 'Reserved', 'Completed', 'Cancelled'
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound Unique Index to prevent race conditions during concurrent bookings
reservationSchema.index(
    { restaurant: 1, date: 1, time: 1, tableNumber: 1 },
    { unique: true, partialFilterExpression: { status: 'Reserved' } }
);

module.exports = mongoose.model('Reservation', reservationSchema);

