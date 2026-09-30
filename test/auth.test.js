require('./setup');
const request = require('supertest');
const app = require('../server');
const User = require('../models/login');

describe('Auth Flow Integration Tests', () => {
    test('POST /sign-up creates new user successfully', async () => {
        const res = await request(app)
            .post('/sign-up')
            .send({
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'password123'
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Signup successful!');

        const userInDb = await User.findOne({ email: 'jane@example.com' });
        expect(userInDb).not.toBeNull();
        expect(userInDb.name).toBe('Jane Doe');
    });

    test('POST /sign-up fails with invalid email format', async () => {
        const res = await request(app)
            .post('/sign-up')
            .send({
                name: 'Invalid Email User',
                email: 'not-an-email',
                password: 'password123'
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Please enter a valid email.');
    });

    test('POST /login logs in user with correct credentials', async () => {
        // Create user
        const user = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'secretpassword'
        });
        await user.save();

        const res = await request(app)
            .post('/login')
            .send({
                username: 'john@example.com',
                password: 'secretpassword'
            });

        expect(res.status).toBe(302);
        expect(decodeURIComponent(res.headers.location)).toContain('/home?success=Login successful!');
    });

    test('POST /login rejects invalid credentials', async () => {
        const user = new User({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'secretpassword'
        });
        await user.save();

        const res = await request(app)
            .post('/login')
            .send({
                username: 'john@example.com',
                password: 'wrongpassword'
            });

        expect(res.status).toBe(200);
        expect(res.text).toContain('Invalid email or password!');
    });

    test('GET /logout clears user session', async () => {
        const agent = request.agent(app);
        const user = new User({
            name: 'John Logout',
            email: 'logout@example.com',
            password: 'password123'
        });
        await user.save();

        await agent.post('/login').send({ username: 'logout@example.com', password: 'password123' });

        const logoutRes = await agent.get('/logout');
        expect(logoutRes.status).toBe(302);
        expect(logoutRes.headers.location).toBe('/home');
    });
});
