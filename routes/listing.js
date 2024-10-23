const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing'); 
const User = require('../models/User');


// Placeholder for database operations
// Replace with actual database integration 
// const listings = []; // This should be replaced with database logic (Solved)

// GET Route: Render the Create Listing Form
router.get('/create', (req, res) => {
    res.render('createListing'); 
});

// POST Route: Handle Form Submission
router.post('/create', async (req, res) => {
    try{ const { title, location, description, condition, category, price, quantity, delivery, color } = req.body;

    // Basic validation (extend as needed)
    if (!title || !description || !price) {
        return res.status(400).render('createListing', { error: 'Please fill in all required fields.' });
    }

    // Create a new listing object 
    const newListing =  new Listing({
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
        userId: req.session.userId // assigning listing to associated user
    });

    // Save the listing to database
    await newListing.save();

    // Redirect to the listing detail page or another appropriate page (profile)
    res.redirect(`/user/profile`);
} catch (err) { 
    console.log(err); 
    res.status(500).send("Create Listing Error")
}
});

// // GET Route: Display Listing Details (Optional)
// router.get('/:id', (req, res) => {
//     const listingId = parseInt(req.params.id, 10);
//     const listing = listing.find(item => item.id === listingId);

//     if (!listing) {
//         return res.status(404).render('404');
//     }

//     res.render('listingDetail', { listing }); // 'listingDetail.ejs'
// });
module.exports = router;