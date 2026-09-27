const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: String,
    name: String,
    email: String,
    date: String,
    time: String,
    guests: Number,
    music: String,
    requests: String,
    status: { type: String, default: 'Reserved' }, // 'Reserved', 'Completed', 'Cancelled'
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reservation', reservationSchema);
