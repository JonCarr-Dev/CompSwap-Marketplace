const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../user');
const Counter = require('../userCount');

describe('User Model', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Hashes the password before saving', async () => {
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword'
    });
    await user.save();
    expect(await bcrypt.compare('testpassword', user.password)).toBe(true);
  });

  test('Auto-generates a unique user ID', async () => {
    const user = new User({
      username: 'uniqueuser',
      email: 'unique@example.com',
      password: 'uniquePassword'
    });
    await user.save();
    expect(user.userID).toBeGreaterThan(0);
  });
});