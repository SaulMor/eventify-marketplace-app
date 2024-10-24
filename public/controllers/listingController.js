// controllers/listingController.js
const Listing = require('../models/Listing');
const multer = require('multer');
const path = require('path');

// Set up Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // e.g., 1638316800000.jpg
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Create Listing
exports.createListing = upload.array('photos', 5); // Handle up to 5 images

exports.createListing = async (req, res) => {
  try {
    const { title, description, price, category, location, condition, handmade, quantity, delivery, color } = req.body;
    let images = [];

    if (req.files) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const newListing = new Listing({
      title,
      description,
      price,
      category,
      location,
      condition,
      handmade,
      quantity,
      delivery,
      color,
      images,
      userId: req.user._id // Assuming authentication middleware populates req.user
    });

    await newListing.save();
    res.redirect(`/listing/${newListing._id}`); // Redirect to the listing detail page
  } catch (error) {
    console.error('Error creating listing:', error);
    res.render('createListing', { error: 'Failed to create listing. Please try again.' });
  }
};

// Get Edit Listing
exports.getEditListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).send('Listing not found');
    }

    // Check if the logged-in user is the owner
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized access');
    }

    res.render('editListing', { listing });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).send('Server Error');
  }
};

// Update Listing
exports.updateListing = upload.array('photos', 5); // Handle up to 5 new images

exports.updateListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { title, description, price, category, location, condition, handmade, quantity, delivery, color } = req.body;

    let images = [];

    if (req.files) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).send('Listing not found');
    }

    // Check if the logged-in user is the owner
    if (listing.userId.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized access');
    }

    // Update fields
    listing.title = title;
    listing.description = description;
    listing.price = price;
    listing.category = category;
    listing.location = location;
    listing.condition = condition;
    listing.handmade = handmade;
    listing.quantity = quantity;
    listing.delivery = delivery;
    listing.color = color;

    // Append new images if any
    if (images.length > 0) {
      listing.images = listing.images.concat(images);
    }

    await listing.save();
    res.redirect(`/listing/${listing._id}`); // Redirect to the listing detail page
  } catch (error) {
    console.error('Error updating listing:', error);
    res.render('editListing', { error: 'Failed to update listing. Please try again.', listing: req.body });
  }
};
