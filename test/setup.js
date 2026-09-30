const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    if (!global.__MONGO_SERVER__) {
        global.__MONGO_SERVER__ = await MongoMemoryServer.create();
    }
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(global.__MONGO_SERVER__.getUri());
    }
    
    // CRITICAL: Ensure indexes are built in the in-memory DB before running tests!
    const Reservation = require('../models/reservation');
    await Reservation.syncIndexes();
}, 30000);

afterEach(async () => {
    if (mongoose.connection && mongoose.connection.db) {
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
    }
});
