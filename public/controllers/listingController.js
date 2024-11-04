// controllers/listingController.js

const Listing = require('../models/Listing');
const path = require('path');
const fs = require('fs');

// Create Listing
exports.createListing = async (req, res) => {
  try {
    const { title, description, price, category, location, condition, handmade, quantity, delivery, color } = req.body;
    let photos = [];

    if (req.files && req.files.length > 0) {
      photos = req.files.map(file => `/uploads/${file.filename}`);
    } else {
      req.flash('error', 'No photos were uploaded.');
      return res.redirect('/listing/create');
    }

    const newListing = new Listing({
      title,
      description,
      price: parseFloat(price),
      category,
      location,
      condition,
      handmade: handmade || 'no',
      quantity: parseInt(quantity, 10) || 1,
      delivery: delivery || 'pickup',
      color: color || 'N/A',
      photos,
      userId: req.session.user.id, // Assuming session-based authentication
    });

    await newListing.save();
    req.flash('success', 'Listing created successfully!');
    res.redirect('/user/profile1');
  } catch (error) {
    console.error('Error creating listing:', error);
    req.flash('error', 'Failed to create listing. Please try again.');
    res.redirect('/listing/create');
  }
};

// Get Edit Listing
exports.getEditListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      req.flash('error', 'Listing not found.');
      return res.redirect('/user/profile1');
    }

    // Check if the logged-in user is the owner
    if (listing.userId.toString() !== req.session.user.id.toString()) {
      req.flash('error', 'Unauthorized access.');
      return res.redirect('/user/profile1');
    }

    res.render('editListing', { listing, csrfToken: req.csrfToken() });
  } catch (error) {
    console.error('Error fetching listing:', error);
    req.flash('error', 'An error occurred while fetching the listing.');
    res.redirect('/user/profile1');
  }
};

// Update Listing
exports.updateListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const { title, description, price, category, location, condition, handmade, quantity, delivery, color } = req.body;

    let photos = [];

    if (req.files && req.files.length > 0) {
      photos = req.files.map(file => `/uploads/${file.filename}`);
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      req.flash('error', 'Listing not found.');
      return res.redirect('/user/profile1');
    }

    // Check if the logged-in user is the owner
    if (listing.userId.toString() !== req.session.user.id.toString()) {
      req.flash('error', 'Unauthorized access.');
      return res.redirect('/user/profile1');
    }

    // Update fields
    listing.title = title;
    listing.description = description;
    listing.price = parseFloat(price);
    listing.category = category;
    listing.location = location;
    listing.condition = condition;
    listing.handmade = handmade || "no";
    listing.quantity = parseInt(quantity, 10) || 1;
    listing.delivery = delivery || "pickup";
    listing.color = color || "N/A";

    // Replace old photos if new ones are uploaded
    if (photos.length > 0) {
      // Delete old photos from the server
      if (listing.photos && listing.photos.length > 0) {
        listing.photos.forEach((photoPath) => {
          const fullPath = path.join(__dirname, "..", "public", photoPath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error("Error deleting old photo:", err);
            }
          });
        });
      }

      // Assign new photos
      listing.photos = photos;
    }

    await listing.save();
    req.flash('success', 'Listing updated successfully!');
    res.redirect('/user/profile1');
  } catch (error) {
    console.error('Error updating listing:', error);
    req.flash('error', 'Failed to update listing. Please try again.');
    res.redirect(`/listing/edit/${req.params.id}`);
  }
};
