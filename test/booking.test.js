require('./setup');
const request = require('supertest');
const app = require('../server');
const User = require('../models/login');
const Reservation = require('../models/reservation');

jest.setTimeout(30000);

describe('Booking Flow Integration Tests', () => {
    let agent;
    let userId;

    beforeEach(async () => {
        agent = request.agent(app);
        const user = new User({
            name: 'Booking User',
            email: 'booker@example.com',
            password: 'password123'
        });
        await user.save();
        userId = user._id;

        await agent
            .post('/login')
            .send({ username: 'booker@example.com', password: 'password123' });
    }, 30000);

    test('GET /reservation redirects unauthenticated users to /login', async () => {
        const unauthenticatedRes = await request(app).get('/reservation');
        expect(unauthenticatedRes.status).toBe(302);
        expect(unauthenticatedRes.headers.location).toBe('/login');
    });

    test('POST /reservation creates reservation successfully', async () => {
        const bookingData = {
            restaurant: 'Royal Fine Dining',
            date: '2026-12-10',
            time: '19:30',
            guests: 4,
            music: 'Classical',
            requests: 'Window seat'
        };

        const res = await agent.post('/reservation').send(bookingData);
        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toContain('/order?success=Reservation confirmed!');


        const createdRes = await Reservation.findOne({ userId, restaurant: 'Royal Fine Dining' });
        expect(createdRes).not.toBeNull();
        expect(createdRes.guests).toBe(4);
        expect(createdRes.tableNumber).toBeDefined();
    });

    test('POST /reservation rejects bookings for past dates', async () => {
        const pastBooking = {
            restaurant: 'Royal Fine Dining',
            date: '2020-01-01',
            time: '19:30',
            guests: 2
        };

        const res = await agent.post('/reservation').send(pastBooking);
        expect(res.status).toBe(400);
        expect(res.text).toContain('Cannot book a table in the past.');
    });

    test('POST /reservation enforces maximum 3 active reservations per user', async () => {
        // Create 3 active reservations for this user
        for (let i = 1; i <= 3; i++) {
            await agent.post('/reservation').send({
                restaurant: `Restaurant ${i}`,
                date: '2026-11-01',
                time: `1${i}:00`,
                guests: 2
            });
        }

        // 4th reservation attempt should fail
        const fourthAttempt = await agent.post('/reservation').send({
            restaurant: 'Restaurant 4',
            date: '2026-11-01',
            time: '20:00',
            guests: 2
        });

        expect(fourthAttempt.status).toBe(400);
        expect(fourthAttempt.text).toContain('You cannot have more than 3 active reservations at a time.');
    });

    test('DELETE /reservation/:id deletes user reservation', async () => {
        const reservation = new Reservation({
            userId,
            restaurant: 'Test Delete Resto',
            date: '2026-11-05',
            time: '18:00',
            tableNumber: 1,
            guests: 2
        });
        await reservation.save();

        const delRes = await agent.delete(`/reservation/${reservation._id}`);
        expect(delRes.status).toBe(200);
        expect(delRes.body.message).toBe('Reservation deleted successfully.');

        const findRes = await Reservation.findById(reservation._id);
        expect(findRes).toBeNull();
    });

    test('DELETE /reservation/:id prevents deleting another user reservation', async () => {
        const otherUser = new User({
            name: 'Other User',
            email: 'other@example.com',
            password: 'password123'
        });
        await otherUser.save();

        const otherReservation = new Reservation({
            userId: otherUser._id,
            restaurant: 'Other Resto',
            date: '2026-11-05',
            time: '18:00',
            tableNumber: 1,
            guests: 2
        });
        await otherReservation.save();

        const delRes = await agent.delete(`/reservation/${otherReservation._id}`);
        expect(delRes.status).toBe(403);
        expect(delRes.body.message).toBe('Unauthorized or not found.');
    });
});
