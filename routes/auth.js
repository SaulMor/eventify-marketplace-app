const express = require('express');
const router = express.Router(); 
const bcrypt = require('bcrypt');
const User = require('../models/User');
// Login route
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

// Signup route
router.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
});

// Handle signup form submission
router.post('/signup', async (req, res) => {
    // Handle signup logic here 
    try { 
        const {name, email, password} = req.body; 
        const encyptedPassword = bcrypt.hashSync(password, 10); 

        const newUser = await User.create({ 
            name, 
            email, 
            password: encyptedPassword
        });
        res.redirect('/auth/login'); 
    } catch(err) { 
        console.error(err); 
        res.status(500).send("Sign up Erorr");
    }
});

// Handle login form submission
router.post('/login', async (req, res) => {
    // Handle login logic here 
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user._id; // Store userId in session
            console.log('User is Logged in', req.session) // adding this to check logging errors i'm facing
            res.redirect('/');
        } else {
            res.redirect('/auth/login'); 
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Log in Error");
    }
});

module.exports = router;
