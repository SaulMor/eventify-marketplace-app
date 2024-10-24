const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const Listing = require('../models/Listing');

// adding a profile route
router.get('/profile', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/signup');
        }

        // Find the user by id to display their profile
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get listings posted by the user
        const listings = await Listing.find({ userId: req.session.userId });
        res.render('profile', { user, listings });
    } catch (error) {
        console.error(error);
        res.status(500).send('Profile Retrieving Error');
    }
}); 
router.get('/profile1', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/auth/signup');
        }

        // Find the user by id to display their profile
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Get listings posted by the user
        const listings = await Listing.find({ userId: req.session.userId });
        res.render('profile1', { user, listings });
    } catch (error) {
        console.error(error);
        res.status(500).send('Profile Retrieving Error');
    }
});

module.exports = router; 
