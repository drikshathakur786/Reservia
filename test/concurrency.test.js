require('./setup');
const request = require('supertest');
const app = require('../server');
const Reservation = require('../models/reservation');
const User = require('../models/login');

jest.setTimeout(30000);

describe('Booking Logic - Concurrency & Race Condition Tests', () => {
    let userAgents = [];
    const CONCURRENT_REQUESTS = 50;
    const CAPACITY_LIMIT = 5;

    beforeEach(async () => {
        process.env.MAX_TABLES_PER_SLOT = String(CAPACITY_LIMIT);
        userAgents = [];

        // Pre-create 50 authenticated user agents
        for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
            const agent = request.agent(app);
            const userEmail = `concurrent_user_${i}_${Date.now()}@example.com`;
            
            const user = new User({
                name: `User ${i}`,
                email: userEmail,
                password: 'password123',
                role: 'user'
            });
            await user.save();

            // Login to establish session
            await agent
                .post('/login')
                .send({ username: userEmail, password: 'password123' });

            userAgents.push(agent);
        }
    }, 30000);

    test(`fires ${CONCURRENT_REQUESTS} simultaneous requests at 1 slot (capacity ${CAPACITY_LIMIT}) and prevents overbooking`, async () => {
        const slotDetails = {
            restaurant: 'Flavors Dining',
            date: '2026-11-20',
            time: '20:00',
            guests: 2,
            music: 'Jazz',
            name: 'Concurrency Tester',
            email: 'test@example.com'
        };

        // Fire 50 requests at the exact same moment using Promise.all
        const promises = userAgents.map(agent =>
            agent.post('/reservation').send(slotDetails)
        );

        const responses = await Promise.all(promises);

        // Count successful bookings (302 Redirect to /order) vs rejected (400 Bad Request)
        const successes = responses.filter(res => res.status === 302 && res.headers.location.includes('/order'));
        const rejected = responses.filter(res => res.status === 400);

        // Verify total reservations saved in MongoDB
        const savedCount = await Reservation.countDocuments({
            restaurant: slotDetails.restaurant,
            date: slotDetails.date,
            time: slotDetails.time,
            status: { $ne: 'Cancelled' }
        });

        // Assertions
        expect(savedCount).toBe(CAPACITY_LIMIT);
        expect(successes.length).toBe(CAPACITY_LIMIT);
        expect(rejected.length).toBe(CONCURRENT_REQUESTS - CAPACITY_LIMIT);

        // Verify all saved reservations have unique table numbers 1..5
        const savedReservations = await Reservation.find({
            restaurant: slotDetails.restaurant,
            date: slotDetails.date,
            time: slotDetails.time
        });
        const tableNumbers = savedReservations.map(r => r.tableNumber).sort((a, b) => a - b);
        expect(tableNumbers).toEqual([1, 2, 3, 4, 5]);
    });
});
