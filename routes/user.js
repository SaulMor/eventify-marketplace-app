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

        // Extract filter query parameters
        const searchQuery = req.query.search ? req.query.search.toLowerCase() : "";
        const sortOption = req.query.sort || "";
        const selectedCategories = req.query.categories
            ? Array.isArray(req.query.categories)
                ? req.query.categories
                : [req.query.categories]
            : [];
        const selectedColors = req.query.colors
            ? Array.isArray(req.query.colors)
                ? req.query.colors
                : [req.query.colors]
            : [];
        const selectedPrice = req.query.price || "all";
        const customPrice = {
            minPrice: req.query.minPrice || "",
            maxPrice: req.query.maxPrice || "",
        };

        // Find the user in the local database
        const user = await User.findById(userId).lean();
        if (!user) {
            req.flash('error', 'User not found.');
            return res.status(404).redirect('/auth/login');
        }

        // Build the query object
        let query = { userId: user._id, isDraft: false };

        // Apply search filter
        if (searchQuery) {
            query.$or = [
                { title: { $regex: searchQuery, $options: 'i' } },
                { category: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
            ];
        }

        // Apply category filters
        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        }

        // Apply color filters using regular expressions
        if (selectedColors.length > 0) {
            const colorRegexes = selectedColors.map(color => new RegExp(`\\b${color}\\b`, 'i'));
            query.color = { $in: colorRegexes };
        }

        // Apply price filters
        if (selectedPrice !== "all") {
            switch (selectedPrice) {
                case "under25":
                    query.price = { $lt: 25 };
                    break;
                case "25-50":
                    query.price = { $gte: 25, $lte: 50 };
                    break;
                case "50-75":
                    query.price = { $gte: 50, $lte: 75 };
                    break;
                case "100+":
                    query.price = { $gt: 100 };
                    break;
                default:
                    break;
            }
        }

        // Apply custom price range if provided
        if (customPrice.minPrice && customPrice.maxPrice) {
            const min = parseFloat(customPrice.minPrice);
            const max = parseFloat(customPrice.maxPrice);
            if (!isNaN(min) && !isNaN(max)) {
                query.price = { ...query.price, $gte: min, $lte: max };
            }
        }

        // Fetch listings based on the query
        let listings = await Listing.find(query).lean();

        // Apply sorting
        if (sortOption) {
            switch (sortOption) {
                case "price-asc":
                    listings.sort((a, b) => a.price - b.price);
                    break;
                case "price-desc":
                    listings.sort((a, b) => b.price - a.price);
                    break;
                case "date-newest":
                    listings.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    break;
                case "date-oldest":
                    listings.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
                    break;
                // Add more sort options as needed
                default:
                    break;
            }
        }

        res.render('profile1', { 
            user, 
            listings, 
            csrfToken: req.csrfToken(),
            success: req.flash("success"),
            error: req.flash("error"),
            search: req.query.search || "",
            sort: sortOption,
            selectedCategories,
            selectedColors,
            selectedPrice,
            customPrice,
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
