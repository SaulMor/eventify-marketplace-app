const express = require('express');
const router = express.Router();

// Login route
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Signup route
router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
});

// Handle signup form submission
router.post('/signup', (req, res) => {
    // Handle signup logic here
});

// Handle login form submission
router.post('/login', (req, res) => {
    // Handle login logic here
});

module.exports = router;
