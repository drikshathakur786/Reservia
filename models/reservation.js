const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    restaurant: String,
    name: String,
    email: String,
    date: String,
    time: String,
    guests: Number,
    music: String,
    requests: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reservation', reservationSchema);
