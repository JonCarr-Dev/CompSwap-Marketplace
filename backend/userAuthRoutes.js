const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('./user');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with that email or username.' });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      return res.status(400).json({ message: info.message });
    }
    const payload = { id: user._id, email: user.email, accountType: user.accountType };
    const token = jwt.sign(payload, 'your_jwt_secret_key', { expiresIn: '1h' });
    return res.json({ message: 'Logged in successfully', token });
  })(req, res, next);
});

module.exports = router;