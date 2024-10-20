const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
  res.render('index', { title: 'Home Page' });
});

// Sign-up route
router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' }); // Render from /views/signup.ejs
});

// Login route
router.get('/login', (req, res) => {
  res.render('login', { title: 'Login' }); // Render from /views/login.ejs
});

module.exports = router;
