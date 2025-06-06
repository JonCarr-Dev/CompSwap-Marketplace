const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Authentication API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  beforeEach(async () => {
    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  afterAll(async () => {
    if (mongoose.connection && mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    await mongoose.connection.close();
  });

  test('Can register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser1', email: 'test1@example.com', password: 'password123' });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered successfully.');
  });

  test('Can login and return a JWT token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', email: 'test2@example.com', password: 'password123' });
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test2@example.com', password: 'password123' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});