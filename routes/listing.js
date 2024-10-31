// routes/listing.js

const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const Offer = require('../models/Offer');
const ensureAuthenticated = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const mongoosePaginate = require('mongoose-paginate-v2');

// Multer Configuration for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Initialize multer with defined storage and file filter
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Handle Multer Errors
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        req.flash('error', err.message);
        return res.redirect('back');
    } else if (err) {
        req.flash('error', err.message || 'An unexpected error occurred.');
        return res.redirect('back');
    }
    next();
});

// ---------------------------------------
// CREATE Listing Routes
// ---------------------------------------

// GET Route: Render the Create Listing Form
router.get('/create', ensureAuthenticated, (req, res) => {
    res.render('createListing', { error: null, listing: {} });
});

// POST Route: Handle Form Submission for Creating a Listing
router.post('/create', ensureAuthenticated, upload.array('photos', 5), [
    // Input Validation
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('condition').notEmpty().withMessage('Condition is required'),
    body('description').notEmpty().withMessage('Description is required'),
    // Add more validations as needed
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(' ');
        req.flash('error', errorMessages);
        return res.status(400).redirect('/listing/create');
    }

    try {
        const { title, location, description, condition, category, price, quantity, delivery, color } = req.body;

        // Handle uploaded photos
        let photos = [];
        if (req.files && req.files.length > 0) {
            console.log('Uploaded Files:', req.files); // Log uploaded files
            photos = req.files.map(file => `/uploads/${file.filename}`);
        } else {
            console.log('No files were uploaded.');
            req.flash('error', 'No files were uploaded.');
            return res.redirect('/listing/create');
        }

        // Create a new listing document
        const newListing = new Listing({
            title,
            price,
            category,
            location,
            condition,
            handmade: req.body.handmade || 'no',
            quantity: req.body.quantity || 1,
            delivery: req.body.delivery || 'pickup',
            color: req.body.color || 'N/A',
            photos,
            userId: req.session.user.id, // Correct association
            description
        });

        // Save the listing to the database
        await newListing.save();

        // Set a success flash message
        req.flash('success', 'Listing created successfully!');

        // Redirect to the user's profile page
        res.redirect('/user/profile1');
    } catch (error) {
        console.error('Error creating listing:', error);
        req.flash('error', 'Failed to create listing. Please try again.');
        res.status(500).redirect('/listing/create');
    }
});

// ---------------------------------------
// READ Listing Routes
// ---------------------------------------

// GET Route: Display Listing Details
router.get("/:id", ensureAuthenticated, async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId).populate('userId', 'name email').lean();

        if (!listing) {
            req.flash('error', 'Listing not found.');
            return res.redirect('/user/profile1');
        }

        // Check if the logged-in user is the owner of the listing
        if (listing.userId._id.toString() !== req.session.user.id.toString()) {
            req.flash("error", "You are not authorized to view this listing.");
            return res.redirect("/user/profile1");
        }

        // Fetch the current user's details
        const currentUser = await User.findById(req.session.user.id).lean();

        res.render("listingDetail", { listing, user: currentUser });
    } catch (error) {
        console.error("Error fetching listing details:", error);
        req.flash('error', 'An error occurred while fetching the listing.');
        res.redirect('/user/profile1');
    }
});

// GET Route: View Offers for a Listing
router.get('/:id/offers', ensureAuthenticated, async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId).populate('userId', 'name email').lean();

        if (!listing) {
            req.flash('error', 'Listing not found.');
            return res.redirect('/user/profile1');
        }

        // Check if the logged-in user is the owner of the listing
        if (listing.userId._id.toString() !== req.session.user.id.toString()) {
            req.flash("error", "You are not authorized to view offers for this listing.");
            return res.redirect("/user/profile1");
        }

        // Fetch offers related to this listing (assuming you have an Offer model)
        const offers = await Offer.find({ listingId: listingId }).populate('userId', 'name email').lean();

        // Set a success flash message if needed
        if (offers.length > 0) {
            req.flash('success', 'Offers fetched successfully!');
        } else {
            req.flash('success', 'No offers received yet.');
        }

        res.render('viewOffers', { listing, offers, user: await User.findById(req.session.user.id).lean() });
    } catch (error) {
        console.error('Error fetching offers:', error);
        req.flash('error', 'An error occurred while fetching offers.');
        res.redirect('/user/profile1');
    }
});

// ---------------------------------------
// UPDATE Listing Routes
// ---------------------------------------

// GET Route: Render the Edit Listing Form
router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId).lean();

        if (!listing) {
            req.flash('error', 'Listing not found.');
            return res.redirect('/user/profile1');
        }

        // Check if the logged-in user is the owner of the listing
        if (listing.userId.toString() !== req.session.user.id.toString()) {
            req.flash('error', 'You are not authorized to edit this listing.');
            return res.redirect('/user/profile1');
        }

        res.render('editListing', { listing, error: null });
    } catch (error) {
        console.error('Error fetching listing for edit:', error);
        req.flash('error', 'An error occurred. Please try again.');
        res.redirect('/user/profile1');
    }
});

// PUT Route: Handle Form Submission for Editing a Listing
router.put('/edit/:id', ensureAuthenticated, upload.array('photos', 5), [
    // Input Validation
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('condition').notEmpty().withMessage('Condition is required'),
    body('description').notEmpty().withMessage('Description is required'),
    // Add more validations as needed
], async (req, res) => {
    const errors = validationResult(req);
    const listingId = req.params.id;

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg).join(' ');
        req.flash('error', errorMessages);
        return res.status(400).redirect(`/listing/edit/${listingId}`);
    }

    try {
        const listing = await Listing.findById(listingId);

        if (!listing) {
            req.flash('error', 'Listing not found.');
            return res.redirect('/user/profile1');
        }

        // Check if the logged-in user is the owner of the listing
        if (listing.userId.toString() !== req.session.user.id.toString()) {
            req.flash('error', 'You are not authorized to edit this listing.');
            return res.redirect('/user/profile1');
        }

        const { title, location, description, condition, category, price, quantity, delivery, color } = req.body;

        // Update listing fields
        listing.title = title;
        listing.price = price;
        listing.category = category;
        listing.location = location;
        listing.condition = condition;
        listing.handmade = req.body.handmade || 'no';
        listing.quantity = req.body.quantity || 1;
        listing.delivery = req.body.delivery || 'pickup';
        listing.color = req.body.color || 'N/A';
        listing.description = description;

        // Handle uploaded photos
        if (req.files && req.files.length > 0) {
            // Optionally, delete old photos from the server
            if (listing.photos && listing.photos.length > 0) {
                listing.photos.forEach(photoPath => {
                    const fullPath = path.join(__dirname, '..', 'public', photoPath);
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            console.error('Error deleting old photo:', err);
                        }
                    });
                });
            }

            // Assign new photos
            listing.photos = req.files.map(file => `/uploads/${file.filename}`);
        }

        // Save the updated listing
        await listing.save();

        // Set a success flash message
        req.flash('success', 'Listing updated successfully!');

        res.redirect('/user/profile1');
    } catch (error) {
        console.error('Error updating listing:', error);
        req.flash('error', 'Failed to update listing. Please try again.');
        res.redirect('/user/profile1');
    }
});

// ---------------------------------------
// DELETE Listing Routes (Optional)
// ---------------------------------------

// DELETE Route: Delete a Listing
router.delete('/delete/:id', ensureAuthenticated, async (req, res) => {
    try {
        const listingId = req.params.id;
        const listing = await Listing.findById(listingId);

        if (!listing) {
            req.flash('error', 'Listing not found.');
            return res.redirect('/user/profile1');
        }

        // Check if the logged-in user is the owner of the listing
        if (listing.userId.toString() !== req.session.user.id.toString()) {
            req.flash('error', 'You are not authorized to delete this listing.');
            return res.redirect('/user/profile1');
        }

        // Remove the listing from the database
        await Listing.findByIdAndDelete(listingId);

        // Optionally, delete associated photos from the server
        if (listing.photos && listing.photos.length > 0) {
            listing.photos.forEach(photoPath => {
                const fullPath = path.join(__dirname, '..', 'public', photoPath);
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error('Error deleting photo:', err);
                    }
                });
            });
        }

        // Set a success flash message
        req.flash('success', 'Listing deleted successfully.');

        // Redirect to the user's profile page
        res.redirect('/user/profile1');
    } catch (error) {
        console.error('Error deleting listing:', error);
        req.flash('error', 'Failed to delete listing. Please try again.');
        res.redirect('/user/profile1');
    }
});

// ---------------------------------------
// Export the Router
// ---------------------------------------

module.exports = router;
