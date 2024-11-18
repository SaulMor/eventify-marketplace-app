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
        const { page = 1, limit = 10 } = req.query;

        // Build the filter object
        let filter = { isDraft: false }; // Exclude drafts by default
        if (category !== 'all') {
            filter.category = category;
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }, // Newest first
            populate: { path: 'userId', select: 'name email profilePic' },
            lean: true,
        };

        // Fetch listings with pagination
        const result = await Listing.paginate(filter, options);

        // Capitalize category name for display
        let categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        if (category === 'all') {
            categoryName = 'All Listings';
        }

        res.render('category', { 
            listings: result.docs,
            user: req.session.user || null,
            categoryName,
            pagination: {
                totalPages: result.totalPages,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
            },
            csrfToken: req.csrfToken() // Pass CSRF token
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while fetching the category.');
        res.redirect('/');
    }
});

module.exports = router;
