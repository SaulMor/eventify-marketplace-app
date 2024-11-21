// routes/category.js

const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const csrf = require('csurf');
const csrfProtection = csrf();
const { query, validationResult } = require('express-validator');

router.get('/:category', csrfProtection, async (req, res) => {
        // Handle Validation Errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash('error', 'Invalid filter parameters.');
            return res.redirect(`/category/${req.params.category}`);
        }

        const categoryParam = req.params.category.toLowerCase(); // Current category
        const userId = req.session.user ? req.session.user.id : null; // Current user

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
        const limit = 10; // Listings per page

        try {
            // Build the filter object
            let filter = { isDraft: false }; // Exclude drafts by default

            // Apply category filter
            if (categoryParam !== 'all') {
                filter.category = categoryParam;
            }

            // Apply search filter
            if (searchQuery) {
                filter.$or = [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                ];
            }

            // Apply additional category filters if selected
            if (selectedCategories.length > 0) {
                // Merge with existing category filter if categoryParam is 'all'
                if (categoryParam === 'all') {
                    filter.$or = filter.$or || [];
                    filter.$or.push({ category: { $in: selectedCategories } });
                } else {
                    // Combine existing category filter with additional categories
                    filter.category = { $in: [filter.category, ...selectedCategories] };
                }
            }

            // Apply color filters using regular expressions
            if (selectedColors.length > 0) {
                const colorRegexes = selectedColors.map(color => new RegExp(`\\b${color}\\b`, 'i'));
                filter.color = { $in: colorRegexes };
            }

            // Apply price filters
            if (selectedPrice !== "all") {
                switch (selectedPrice) {
                    case "under25":
                        filter.price = { $lt: 25 };
                        break;
                    case "25-50":
                        filter.price = { $gte: 25, $lte: 50 };
                        break;
                    case "50-75":
                        filter.price = { $gte: 50, $lte: 75 };
                        break;
                    case "100+":
                        filter.price = { $gt: 100 };
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
                    filter.price = { ...filter.price, $gte: min, $lte: max };
                }
            }

            // Build sort options
            let sort = { createdAt: -1 }; // Default: Newest first
            if (sortOption) {
                switch (sortOption) {
                    case "price-asc":
                        sort = { price: 1 };
                        break;
                    case "price-desc":
                        sort = { price: -1 };
                        break;
                    case "date-newest":
                        sort = { createdAt: -1 };
                        break;
                    case "date-oldest":
                        sort = { createdAt: 1 };
                        break;
                    // Add more sort options as needed
                    default:
                        break;
                }
            }

            // Fetch listings without pagination
            const listings = await Listing.find(filter)
                .sort(sort)
                .populate('userId', 'name email profilePic')
                .lean();

            // Capitalize category name for display
            let categoryName = categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1);

            if (categoryParam === 'all') {
                categoryName = 'All';
            }

            res.render('category', { 
                listings,
                user: req.session.user || null,
                categoryName,
                pagination: {
                    // Since pagination is not used, set default values
                    totalPages: 1,
                    page: 1,
                    hasPrevPage: false,
                    hasNextPage: false,
                    prevPage: null,
                    nextPage: null,
                },
                csrfToken: req.csrfToken(), // Pass CSRF token
                search: searchQuery,
                sort: sortOption,
                selectedCategories,
                selectedColors,
                selectedPrice,
                customPrice,
                categoryParam, // Ensure this is passed
            });
        } catch (error) {
            console.error(error);
            req.flash('error', 'An error occurred while fetching the category.');
            res.redirect('/');
        }
    });

module.exports = router;
