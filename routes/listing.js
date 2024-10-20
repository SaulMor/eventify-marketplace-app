// routes/listing.js

const express = require('express');
const router = express.Router();

// Placeholder for database operations
// Replace with actual database integration 
const listings = []; // This should be replaced with database logic

// GET Route: Render the Create Listing Form
router.get('/create', (req, res) => {
    res.render('createListing'); 
});

// POST Route: Handle Form Submission
router.post('/create', (req, res) => {
    const { title, location, description, condition, category, price, quantity, delivery, color } = req.body;

    // Basic validation (extend as needed)
    if (!title || !description || !price) {
        return res.status(400).render('createListing', { error: 'Please fill in all required fields.' });
    }

    // Create a new listing object
    const newListing = {
        id: listings.length + 1, // Replace with a proper unique ID 
        title,
        location,
        description,
        condition,
        category,
        price,
        quantity,
        delivery,
        color,
        photos: req.files ? req.files.photos : [], // Handle file uploads if implemented
        createdAt: new Date()
    };

    // Save the listing to database
    listings.push(newListing); // Replace with actual database save operation

    // Redirect to the listing detail page or another appropriate page
    res.redirect(`/listing/${newListing.id}`);
});

// GET Route: Display Listing Details (Optional)
router.get('/:id', (req, res) => {
    const listingId = parseInt(req.params.id, 10);
    const listing = listings.find(item => item.id === listingId);

    if (!listing) {
        return res.status(404).render('404');
    }

    res.render('listingDetail', { listing }); // 'listingDetail.ejs'
});

module.exports = router;
