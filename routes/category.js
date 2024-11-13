// routes/category.js

const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const csrf = require('csurf');
const csrfProtection = csrf();

// Category Page Route
router.get('/:category', csrfProtection, async (req, res) => {
    const category = req.params.category.toLowerCase(); // Convert to lowercase
    try {
        let filter = {};
        if (category !== 'all') {
            filter.category = category;
        }

        const listings = await Listing.find(filter).lean();
        const user = req.session.user ? await User.findById(req.session.user.id).lean() : null;
        
        let categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        if (category === 'all') {
            categoryName = 'All Listings';
        }
        
        res.render('category', { 
            listings,
            user,
            categoryName,
            csrfToken: req.csrfToken() // Pass CSRF token
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while fetching the category.');
        res.redirect('/');
    }
});

module.exports = router;
