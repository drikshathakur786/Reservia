require('./setup');
const request = require('supertest');
const app = require('../server');
const User = require('../models/login');

describe('Role & Authorization Integration Tests', () => {
    test('GET /admin blocks non-admin users with 403', async () => {
        const agent = request.agent(app);
        const normalUser = new User({
            name: 'Regular User',
            email: 'user@example.com',
            password: 'password123',
            role: 'user'
        });
        await normalUser.save();

        await agent.post('/login').send({ username: 'user@example.com', password: 'password123' });

        const adminRes = await agent.get('/admin');
        expect(adminRes.status).toBe(403);
        expect(adminRes.text).toContain('403 Forbidden: Admins Only');
    });

    test('GET /admin allows admin user access', async () => {
        const agent = request.agent(app);
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });
        await adminUser.save();

        await agent.post('/login').send({ username: 'admin@example.com', password: 'password123' });

        const adminRes = await agent.get('/admin');
        expect(adminRes.status).toBe(200);
        expect(adminRes.text).toContain('Dashboard');
    });

    test('GET /make-me-admin elevates user to admin role', async () => {
        const agent = request.agent(app);
        const normalUser = new User({
            name: 'Elevate Me',
            email: 'elevate@example.com',
            password: 'password123',
            role: 'user'
        });
        await normalUser.save();

        await agent.post('/login').send({ username: 'elevate@example.com', password: 'password123' });

        const elevateRes = await agent.get('/make-me-admin');
        expect(elevateRes.status).toBe(302);
        expect(elevateRes.headers.location).toBe('/admin');

        const updatedUser = await User.findById(normalUser._id);
        expect(updatedUser.role).toBe('admin');
    });
});
