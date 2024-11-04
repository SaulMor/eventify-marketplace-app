// controllers/listingController.js

const Listing = require('../models/Listing');
const User = require('../models/User');
const path = require('path');
const fs = require("fs");

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

// Delete Listing
exports.deleteListing = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/user/profile1");
    }

    // Check if the logged-in user is the owner of the listing
    if (listing.userId.toString() !== req.session.user.id.toString()) {
      req.flash("error", "You are not authorized to delete this listing.");
      return res.redirect("/user/profile1");
    }

    // Remove the listing from the database
    await Listing.findByIdAndDelete(listingId);

    // Optionally, delete associated photos from the server
    if (listing.photos && listing.photos.length > 0) {
      listing.photos.forEach((photoPath) => {
        const fullPath = path.join(__dirname, "..", "public", photoPath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error("Error deleting photo:", err);
          }
        });
      });
    }

    // Set a success flash message
    req.flash("success", "Listing deleted successfully.");

    // Redirect to the user's profile page
    res.redirect("/user/profile1");
  } catch (error) {
    console.error("Error deleting listing:", error);
    req.flash("error", "Failed to delete listing. Please try again.");
    res.redirect("/user/profile1");
  }
};

// Get Public Listing Details
exports.getListingDetails = async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId)
      .populate('userId') // Populate the userId field
      .lean();

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/");
    }

    const user = req.session.user
      ? await User.findById(req.session.user.id).lean()
      : null;

    res.render("productDetail", { product: listing, user });
  } catch (error) {
    console.error("Error fetching listing details:", error);
    req.flash("error", "An error occurred while fetching the listing.");
    res.redirect("/");
  }
};

// Get Owner-Specific Listing Detail
exports.getListingDetail = async (req, res) => {
  try {
    const listing = req.listing; // From authorizeListing middleware
    res.render("listingDetail", { listing, user: req.session.user });
  } catch (error) {
    console.error("Error fetching listing detail:", error);
    req.flash("error", "An error occurred while fetching the listing.");
    res.redirect("/user/profile1");
  }
};

// Get Offers for a Listing
exports.getListingOffers = async (req, res) => {
  try {
    const listing = req.listing; // From authorizeListing middleware

    // Fetch offers related to this listing (Offer model)
    const offers = await Offer.find({ listingId: listing._id })
      .populate("userId", "username email")
      .lean();

    // Set a success flash message if needed
    if (offers.length > 0) {
      req.flash("success", "Offers fetched successfully!");
    } else {
      req.flash("success", "No offers received yet.");
    }

    res.render("viewOffers", {
      listing,
      offers,
      user: await User.findById(req.session.user.id).lean(),
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    req.flash("error", "An error occurred while fetching offers.");
    res.redirect("/user/profile1");
  }
};
