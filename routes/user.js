// routes/user.js

const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing'); 
const ensureAuthenticated = require('../middleware/auth'); // Import the middleware
const csrf = require('csurf');
const csrfProtection = csrf();

// GET Route: User Profile Page with Published Listings Only
router.get('/profile1', ensureAuthenticated, csrfProtection, async (req, res) => {
    try {
        const userId = req.session.user.id; // Retrieve user ID from session

        // Find the user in the local database
        const user = await User.findById(userId).lean();
        if (!user) {
            req.flash('error', 'User not found.');
            return res.status(404).redirect('/auth/login');
        }

        // Get only published listings (isDraft: false) posted by the user
        const listings = await Listing.find({ userId: user._id, isDraft: false }).sort({ updatedAt: -1 }).lean();

        res.render('profile1', { 
            user, 
            listings, 
            csrfToken: req.csrfToken() 
        });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        req.flash('error', 'An error occurred while retrieving your profile.');
        res.redirect('/auth/login');
    }
});

router.get('/profile', ensureAuthenticated, csrfProtection, async (req, res) => {
    try {
        const userId = req.session.user.id; // Retrieve user ID from session

        // Find the user in the local database
        const user = await User.findById(userId).lean();
        if (!user) {
            req.flash('error', 'User not found.');
            return res.status(404).redirect('/auth/login');
        }

        // Get listings posted by the user
        const listings = await Listing.find({ userId: user._id }).lean();

        res.render('profile', { 
            user, 
            listings, 
            csrfToken: req.csrfToken() 
        });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        req.flash('error', 'An error occurred while retrieving your profile.');
        res.redirect('/auth/login');
    }
}); 

module.exports = router; 
