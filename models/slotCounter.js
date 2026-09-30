const mongoose = require('mongoose');

// Atomic slot counter — one document per (restaurant, date, time) slot
const slotCounterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // "restaurant::date::time"
    count: { type: Number, default: 0 }
});

module.exports = mongoose.model('SlotCounter', slotCounterSchema);
