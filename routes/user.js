// routes/user.js

const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing'); // Ensure Listing model exists
const ensureAuthenticated = require('../middleware/auth'); // Import the middleware

// Profile Route (Protected)
router.get('/profile1', ensureAuthenticated, async (req, res) => {
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

        res.render('profile1', { user, listings, csrfToken: res.locals.csrfToken });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        req.flash('error', 'An error occurred while retrieving your profile.');
        res.redirect('/auth/login');
    }
});

// Optionally, you can remove or update the /profile route if not needed
router.get('/profile', ensureAuthenticated, async (req, res) => {
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

        res.render('profile', { user, listings, csrfToken: res.locals.csrfToken });
    } catch (error) {
        console.error('Error retrieving profile:', error);
        req.flash('error', 'An error occurred while retrieving your profile.');
        res.redirect('/auth/login');
    }
}); 

module.exports = router; 
