const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const connectDB = require('./db');
const userAuth = require('./userAuth');
const userAuthRoutes = require('./userAuthRoutes');
const app = express();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your_default_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  })
);

app.use(userAuth.initialize());
app.use(userAuth.session());

app.set('views', path.join(__dirname, '../frontend'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', userAuthRoutes);

app.get('/', (req, res) => {
  res.render('home', { title: 'Marketplace Home' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

app.get('/listing-create', (req, res) => {
  res.render('listingCreate', { title: 'Create Listing' });
});

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;