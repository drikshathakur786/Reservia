/**
 * Concurrency Stress Test Script for Reservia
 * --------------------------------------------
 * Demonstrates high-concurrency race condition prevention by sending 50 simultaneous
 * HTTP POST reservation requests at a single time slot with capacity MAX_TABLES_PER_SLOT = 5.
 *
 * Usage: node scripts/test-concurrency.js
 */

process.env.NODE_ENV = 'test';
process.env.MAX_TABLES_PER_SLOT = '5';

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../server');
const User = require('../models/login');
const Reservation = require('../models/reservation');

const CONCURRENT_REQUESTS = 50;
const CAPACITY_LIMIT = 5;

async function runStressTest() {
    console.log('\n======================================================');
    console.log('🚀 RESERVIA CONCURRENCY & RACE CONDITION STRESS TEST');
    console.log('======================================================\n');

    console.log('📦 Starting In-Memory MongoDB Server...');
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('✅ Connected to MongoMemoryServer.\n');

    console.log(`👤 Creating & Authenticating ${CONCURRENT_REQUESTS} distinct user sessions...`);
    const userAgents = [];
    for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
        const agent = request.agent(app);
        const email = `stress_user_${i}_${Date.now()}@test.com`;
        const user = new User({
            name: `Stress Tester ${i}`,
            email: email,
            password: 'password123'
        });
        await user.save();
        await agent.post('/login').send({ username: email, password: 'password123' });
        userAgents.push(agent);
    }
    console.log(`✅ ${CONCURRENT_REQUESTS} sessions authenticated successfully.\n`);

    const slotDetails = {
        restaurant: 'Grand Palace Dining',
        date: '2026-12-25',
        time: '20:00',
        guests: 2,
        music: 'Acoustic',
        requests: 'Stress test reservation'
    };

    console.log(`💥 FIRING ${CONCURRENT_REQUESTS} SIMULTANEOUS REQUESTS AT 1 SLOT...`);
    console.log(`   Slot: ${slotDetails.restaurant} | ${slotDetails.date} @ ${slotDetails.time}`);
    console.log(`   Capacity Limit: ${CAPACITY_LIMIT} tables\n`);

    const startTime = Date.now();
    const promises = userAgents.map(agent => agent.post('/reservation').send(slotDetails));
    const responses = await Promise.all(promises);
    const durationMs = Date.now() - startTime;

    const successfulBookings = responses.filter(r => r.status === 302 && r.headers.location.includes('/order'));
    const rejectedBookings = responses.filter(r => r.status === 400);

    const savedInDbCount = await Reservation.countDocuments({
        restaurant: slotDetails.restaurant,
        date: slotDetails.date,
        time: slotDetails.time,
        status: { $ne: 'Cancelled' }
    });

    const savedReservations = await Reservation.find({
        restaurant: slotDetails.restaurant,
        date: slotDetails.date,
        time: slotDetails.time
    }).sort({ tableNumber: 1 });

    console.log('======================================================');
    console.log('📊 STRESS TEST RESULTS');
    console.log('======================================================');
    console.log(`⚡ Execution Duration        : ${durationMs} ms`);
    console.log(`📥 Total Requests Fired     : ${CONCURRENT_REQUESTS}`);
    console.log(`✅ Successful Bookings (302): ${successfulBookings.length}`);
    console.log(`❌ Rejected / Blocked (400) : ${rejectedBookings.length}`);
    console.log(`🗄️  Total Saved in Mongo DB  : ${savedInDbCount}`);
    console.log('------------------------------------------------------');
    console.log('📋 Assigned Table Breakdown:');
    savedReservations.forEach(res => {
        console.log(`   - Table #${res.tableNumber} assigned to Reservation ID: ${res._id}`);
    });
    console.log('------------------------------------------------------');

    if (savedInDbCount === CAPACITY_LIMIT && successfulBookings.length === CAPACITY_LIMIT) {
        console.log('\n🎉 SUCCESS: RACE CONDITION PREVENTED! ZERO DOUBLE-BOOKINGS OCCURRED!\n');
    } else {
        console.error('\n🚨 FAILURE: CAPACITY BREACH OR RACE CONDITION OCCURRED!\n');
    }

    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(0);
}

runStressTest().catch(err => {
    console.error('Fatal Stress Test Error:', err);
    process.exit(1);
});
