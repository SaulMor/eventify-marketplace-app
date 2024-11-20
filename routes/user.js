// routes/user.js

const express = require('express'); 
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing'); 
const ensureAuthenticated = require('../middleware/auth'); // Import the middleware
const csrf = require('csurf');
const csrfProtection = csrf();
const bcrypt = require('bcryptjs');  // Add bcrypt for password hashing

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

// GET Route: User Settings Page
router.get('/settings', ensureAuthenticated, csrfProtection, async (req, res) => {
    try {
        const userId = req.session.user.id; // Retrieve user ID from session

        // Find the user in the local database
        const user = await User.findById(userId).lean();
        if (!user) {
            req.flash('error', 'User not found.');
            return res.status(404).redirect('/auth/login');
        }

        res.render('settings', {
            user,
            csrfToken: req.csrfToken() // CSRF protection token
        });
    } catch (error) {
        console.error('Error retrieving settings for editing:', error);
        req.flash('error', 'An error occurred while retrieving your settings.');
        res.redirect('/auth/login');
    }
});

// POST Route: Update User Settings (Name, Email, Password)
router.post('/settings', ensureAuthenticated, csrfProtection, async (req, res) => {
    try {
        const userId = req.session.user.id; // Retrieve user ID from session
        const { name, email, password } = req.body;

        // Find the user in the local database
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.status(404).redirect('/auth/login');
        }

        // Update the user's name and email
        if (name) user.name = name;
        if (email) user.email = email;

        // If the user provided a new password, hash it and save
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);  // Hashing the password
            user.password = hashedPassword;
        }

        // Save the updated user
        await user.save();

        req.flash('success', 'Settings updated successfully!');
        res.redirect('/settings'); // Redirect to the settings page after update
    } catch (error) {
        console.error('Error updating settings:', error);
        req.flash('error', 'An error occurred while updating your settings.');
        res.redirect('/settings');
    }
});



module.exports = router; 
