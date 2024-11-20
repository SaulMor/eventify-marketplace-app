// routes/listing.js

const express = require('express');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const csrf = require('csurf');
const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const User = require("../models/User");
const Event = require("../models/Event"); // Import Event model
const Offer = require("../models/Offer");

const ensureAuthenticated = require("../middleware/auth");
const authorizeListing = require("../middleware/authorizeListing");

// Initialize CSRF Protection
const csrfProtection = csrf();

// -----------------------------
// Multer Configuration for Image Uploads
// -----------------------------

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads"); // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"));
  }
};

// Initialize multer with defined storage and file filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per photo
  fileFilter: fileFilter,
});

// ---------------------------------------
// CREATE Listing Routes
// ---------------------------------------

// GET Route: Render the Create Listing Form
router.get("/create", ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    // Fetch active events based on the current date
    const currentDate = new Date();
    const activeEvents = await Event.find({
      'activeDates.start': { $lte: currentDate },
      'activeDates.end': { $gte: currentDate }
    }).lean();

    res.render("createListing", {
      error: null,
      listing: {},
      csrfToken: req.csrfToken(),
      events: activeEvents // Pass active events to the template
    });
  } catch (error) {
    console.error('Error fetching active events:', error);
    req.flash("error", "Unable to load events. Please try again later.");
    res.redirect("/");
  }
});

// POST Route: Handle Form Submission for Creating a Listing (with Draft Support)
router.post(
  "/create",
  ensureAuthenticated,
  upload.array("photos", 5), // Handle up to 5 images
  csrfProtection,
  [
    // Input Validation
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Price must be a positive number"),
    body("category").notEmpty().withMessage("Category is required"),
    body("condition").notEmpty().withMessage("Condition is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("quantity")
      .isInt({ gt: 0 })
      .withMessage("Quantity must be a positive integer"),
    // Add more validations as needed
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(" ");
      req.flash("error", errorMessages);
      return res.status(400).redirect("/listing/create");
    }

    try {
      const {
        title,
        location,
        description,
        condition,
        category,
        price,
        quantity,
        delivery,
        color,
        action, // Extract action from form
        event, // Event ID from form
      } = req.body;

      // Handle uploaded photos
      let photos = [];
      if (req.files && req.files.length > 0) {
        photos = req.files.map((file) => `/uploads/${file.filename}`);
      } else {
        photos = ["/media/images/default.jpg"];
      }

      // Determine if the listing is a draft based on the action value
      const draftStatus = action === 'save-draft';

      // Validate category if necessary
      const allowedCategories = ['wedding', 'birthday', 'halloween', 'academic', 'corporate', 'cultural', 'entertainment', 'holiday', 'luxury', 'seasonal'];
      if (!allowedCategories.includes(category)) {
        req.flash('error', 'Invalid category selected.');
        return res.redirect('/listing/create');
      }

      // If an event is selected, verify its validity
      let eventId = null;
      if (event) {
        const selectedEvent = await Event.findById(event).lean();
        if (selectedEvent) {
          eventId = selectedEvent._id;
        } else {
          req.flash('error', 'Selected event does not exist.');
          return res.redirect('/listing/create');
        }
      }

      // Create a new listing document
      const newListing = new Listing({
        title,
        description,
        photos,
        price,
        originalPrice: req.body.originalPrice || undefined, // Handle optional field
        userId: req.session.user.id,
        category,
        event: eventId, // Associate with event if selected
        isDraft: draftStatus,
        location,
        condition,
        handmade: req.body.handmade || "no",
        quantity: parseInt(quantity, 10) || 1,
        delivery: delivery || "pickup",
        color: color || "N/A",
      });

      await newListing.save();

      req.flash("success", draftStatus ? "Draft saved successfully!" : "Listing created successfully!");
      res.redirect(draftStatus ? "/listing/drafts" : "/user/profile1");
    } catch (error) {
      console.error("Error creating listing:", error);
      req.flash("error", "Failed to create listing. Please try again.");
      res.redirect("/listing/create");
    }
  }
);

// ---------------------------------------
// DRAFTS MANAGEMENT ROUTES
// ---------------------------------------

// GET Route: List All Drafts for the User
router.get("/drafts", ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Extract filter parameters from query string (if any)
    let selectedCategories = req.query.categories;
    if (!selectedCategories) {
      selectedCategories = [];
    } else if (!Array.isArray(selectedCategories)) {
      selectedCategories = [selectedCategories];
    }

    let selectedColors = req.query.colors;
    if (!selectedColors) {
      selectedColors = [];
    } else if (!Array.isArray(selectedColors)) {
      selectedColors = [selectedColors];
    }

    const selectedPrice = req.query.price || 'all';

    const customPrice = {
      minPrice: req.query['min-price'] || '',
      maxPrice: req.query['max-price'] || ''
    };

    // Fetch drafts from the database
    let drafts = await Listing.find({ userId: userId, isDraft: true }).sort({ updatedAt: -1 }).lean();

    // Apply Filters
    if (selectedCategories.length > 0) {
      drafts = drafts.filter(draft => selectedCategories.includes(draft.category));
    }

    if (selectedColors.length > 0) {
      drafts = drafts.filter(draft => selectedColors.includes(draft.color));
    }

    switch (selectedPrice) {
      case 'under25':
        drafts = drafts.filter(draft => draft.price < 25);
        break;
      case '25-50':
        drafts = drafts.filter(draft => draft.price >= 25 && draft.price <= 50);
        break;
      case '50-75':
        drafts = drafts.filter(draft => draft.price >= 50 && draft.price <= 75);
        break;
      case '100+':
        drafts = drafts.filter(draft => draft.price >= 100);
        break;
      // 'all' case doesn't filter anything
    }

    if (customPrice.minPrice !== '' && customPrice.maxPrice !== '') {
      const min = parseFloat(customPrice.minPrice);
      const max = parseFloat(customPrice.maxPrice);
      if (!isNaN(min) && !isNaN(max)) {
        drafts = drafts.filter(draft => draft.price >= min && draft.price <= max);
      }
    }

    // Render the template with all necessary variables
    res.render("listDrafts", {
      drafts: drafts,
      user: req.session.user,
      csrfToken: req.csrfToken(),
      selectedCategories: selectedCategories,
      selectedColors: selectedColors,
      selectedPrice: selectedPrice,
      customPrice: customPrice
    });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    req.flash("error", "Failed to fetch drafts.");
    res.redirect("/user/profile1");
  }
});

// DELETE Route: Delete a Draft Listing
router.delete('/drafts/delete/:id', ensureAuthenticated, csrfProtection, authorizeListing, async (req, res) => {

  try {
    const listingId = req.params.id;
    const userId = req.session.user.id;

    const listing = req.listing; // From authorizeListing middleware

    // Ensure that this route only deletes drafts
    if (!listing.isDraft) {
      req.flash("error", "Cannot delete a published listing via this route.");
      return res.redirect("/user/profile1");
    }

    // Remove associated photos from filesystem
    if (listing.photos && listing.photos.length > 0) {
      for (const photoPath of listing.photos) {
        const sanitizedPhotoPath = path.basename(photoPath); // Prevent path traversal
        const fullPath = path.join(__dirname, "..", "public", "uploads", sanitizedPhotoPath);

        try {
          await fs.promises.unlink(fullPath);
        } catch (err) {
          console.error(`Error deleting photo ${photoPath}:`, err);
          // Continue deleting other photos
        }
      }
    }

    // Remove the listing from the database
    await Listing.findByIdAndDelete(listingId);

    // Set a success flash message
    req.flash("success", "Draft listing deleted successfully.");
    res.redirect("/listing/drafts");
  } catch (error) {
    console.error("Error deleting draft:", error);
    req.flash("error", "Failed to delete draft. Please try again.");
    res.redirect("/listing/drafts");
  }
});

// POST /listing/:id/favorite - Toggle Favorite Status
router.post('/:id/favorite', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
      const userId = req.session.user.id;
      const listingId = req.params.id;

      // Validate the listing ID format
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
          if (req.xhr || req.headers.accept.indexOf('json') > -1) {
              return res.status(400).json({ error: 'Invalid listing ID.' });
          }
          req.flash('error', 'Invalid listing ID.');
          return res.redirect(req.get('Referrer') || '/');
      }

      // Check if the listing exists
      const listing = await Listing.findById(listingId);
      if (!listing) {
          if (req.xhr || req.headers.accept.indexOf('json') > -1) {
              return res.status(404).json({ error: 'Listing not found.' });
          }
          req.flash('error', 'Listing not found.');
          return res.redirect(req.get('Referrer') || '/');
      }

      // Find the user
      const user = await User.findById(userId);

      // Convert listingId to string for consistent comparison
      const listingIdStr = listingId.toString();

      // Check if the listing is already in favorites
      const isFavorited = user.favorites.some(id => id.toString() === listingIdStr);

      if (isFavorited) {
          // Remove from favorites
          user.favorites = user.favorites.filter(id => id.toString() !== listingIdStr);
          await user.save();

          if (req.xhr || req.headers.accept.indexOf('json') > -1) {
              // AJAX Request: Respond with JSON
              return res.status(200).json({ message: 'Removed from favorites.' });
          } else {
              // Standard Request: Set flash message and redirect
              req.flash('success', 'Listing removed from your favorites.');
              return res.redirect(req.get('Referrer') || '/');
          }
      } else {
          // Add to favorites
          user.favorites.push(listingId);
          await user.save();

          if (req.xhr || req.headers.accept.indexOf('json') > -1) {
              // AJAX Request: Respond with JSON
              return res.status(200).json({ message: 'Added to favorites.' });
          } else {
              // Standard Request: Set flash message and redirect
              req.flash('success', 'Listing added to your favorites.');
              return res.redirect(req.get('Referrer') || '/');
          }
      }

  } catch (error) {
      console.error('Error toggling favorite:', error);
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(500).json({ error: 'An error occurred while updating your favorites.' });
      }
      req.flash('error', 'An error occurred while updating your favorites.');
      res.redirect(req.get('Referrer') || '/');
  }
});

// ---------------------------------------
// EDIT and DELETE Listing Routes
// ---------------------------------------

// GET Route: Render the Edit Listing Form
router.get(
  "/edit/:id",
  ensureAuthenticated,
  authorizeListing,
  csrfProtection,
  async (req, res) => {
    try {
      const listing = req.listing; // From authorizeListing middleware

      // Fetch active events based on the current date
      const currentDate = new Date();
      const activeEvents = await Event.find({
        'activeDates.start': { $lte: currentDate },
        'activeDates.end': { $gte: currentDate }
      }).lean();

      res.render("editListing", {
        listing,
        user: req.session.user || null,
        csrfToken: req.csrfToken(),
        events: activeEvents // Pass active events to the template
      });
    } catch (error) {
      console.error("Error fetching listing for edit:", error);
      req.flash("error", "An error occurred. Please try again.");
      res.redirect("/user/profile1");
    }
  }
);

// POST Route: Handle Form Submission for Editing a Listing (with Draft Support)
router.post(
  "/edit/:id",
  ensureAuthenticated,
  authorizeListing,
  upload.array("photos", 5), // Handle up to 5 new images
  csrfProtection, 
  [
      // Input Validation
      body("title").trim().notEmpty().withMessage("Title is required"),
      body("price")
          .isFloat({ gt: 0 })
          .withMessage("Price must be a positive number"),
      body("category").notEmpty().withMessage("Category is required"),
      body("condition").notEmpty().withMessage("Condition is required"),
      body("description").notEmpty().withMessage("Description is required"),
      body("quantity")
          .isInt({ gt: 0 })
          .withMessage("Quantity must be a positive integer"),
      // Add more validations as needed
  ],
  async (req, res) => {
      const errors = validationResult(req);
      const listingId = req.params.id;

      if (!errors.isEmpty()) {
          const errorMessages = errors
              .array()
              .map((err) => err.msg)
              .join(" ");
          req.flash("error", errorMessages);
          return res.status(400).redirect(`/listing/edit/${listingId}`);
      }

      try {
          const listing = await Listing.findById(listingId); // Ensure you fetch the listing

          if (!listing) {
              req.flash("error", "Listing not found.");
              return res.redirect("/user/profile1");
          }

          // Check if the logged-in user is the owner of the listing
          if (listing.userId.toString() !== req.session.user.id.toString()) {
              req.flash("error", "You are not authorized to edit this listing.");
              return res.redirect("/user/profile1");
          }

          const {
              title,
              location,
              description,
              condition,
              category,
              price,
              quantity,
              delivery,
              color,
              action, // Extract action from form
              event, // Event ID from form
          } = req.body;

          // Determine if the listing is a draft based on the action value
          const draftStatus = action === 'save-draft';

          // Update listing fields
          listing.title = title;
          listing.price = parseFloat(price);
          listing.category = category;
          listing.location = location;
          listing.condition = condition;
          listing.handmade = req.body.handmade || "no";
          listing.quantity = parseInt(quantity, 10) || 1;
          listing.delivery = delivery || "pickup";
          listing.color = color || "N/A";
          listing.description = description;
          listing.isDraft = draftStatus; // Set draft status

          // Validate category if necessary
          const allowedCategories = ['wedding', 'birthday', 'halloween', 'academic', 'corporate', 'cultural', 'entertainment', 'holiday', 'luxury', 'seasonal'];
          if (!allowedCategories.includes(category)) {
            req.flash('error', 'Invalid category selected.');
            return res.redirect(`/listing/edit/${listingId}`);
          }

          // If an event is selected, verify its validity
          if (event) {
            const selectedEvent = await Event.findById(event).lean();
            if (selectedEvent) {
              listing.event = selectedEvent._id;
            } else {
              req.flash('error', 'Selected event does not exist.');
              return res.redirect(`/listing/edit/${listingId}`);
            }
          } else {
            listing.event = null; // Remove event association if not selected
          }

          // Process removed photos
          const removedPhotos = req.body.removedPhotos
              ? (Array.isArray(req.body.removedPhotos) ? req.body.removedPhotos : [req.body.removedPhotos])
              : [];

          if (removedPhotos.length > 0) {
              listing.photos = listing.photos.filter(
                  (photo) => !removedPhotos.includes(photo)
              );

              for (const photoPath of removedPhotos) {
                  // Ensure photoPath does not start with a slash to prevent path traversal
                  const sanitizedPhotoPath = path.basename(photoPath); // Prevent path traversal
                  const fullPath = path.join(__dirname, "..", "public", "uploads", sanitizedPhotoPath);

                  try {
                      await fs.promises.unlink(fullPath); // Asynchronous file deletion
                  } catch (err) {
                      console.error(`Error deleting photo ${photoPath}:`, err);
                      // Optionally, flash an error message or handle the error as needed
                  }
              }
          }

          // Handle uploaded photos
          if (req.files && req.files.length > 0) {
              const existingPhotoCount = listing.photos.length;
              const newPhotoCount = req.files.length;
              const totalPhotos = existingPhotoCount + newPhotoCount;

              if (totalPhotos > 5) {
                  // Delete newly uploaded files to prevent storage clutter
                  for (const file of req.files) {
                      const filePath = path.join(__dirname, "..", "public", "uploads/", file.filename);

                      try {
                          await fs.promises.unlink(filePath);
                      } catch (err) {
                          console.error(`Error deleting uploaded file ${file.filename}:`, err);
                      }
                  }

                  req.flash(
                      "error",
                      `You can only have a maximum of 5 photos. You currently have ${existingPhotoCount} photo(s).`
                  );
                  return res.redirect(`/listing/edit/${listingId}`);
              }

              // Append new photos to the existing array
              const newPhotos = req.files.map((file) => `/uploads/${file.filename}`);
              listing.photos = listing.photos.concat(newPhotos);
          }

          // Save the updated listing
          await listing.save();

          // Set a success flash message
          req.flash("success", listing.isDraft ? "Draft updated successfully!" : "Listing updated successfully!");

          // Redirect based on draft status
          res.redirect(listing.isDraft ? "/listing/drafts" : "/user/profile1");
      } catch (error) {
          console.error("Error updating listing:", error);
          req.flash("error", "Failed to update listing. Please try again.");
          res.redirect(`/listing/edit/${listingId}`);
      }
  }
);

// DELETE Route: Delete a Listing
router.delete(
  "/delete/:id",
  ensureAuthenticated,
  csrfProtection,
  authorizeListing,
  async (req, res) => {
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
  }
);

// ---------------------------------------
// READ Listing Routes
// ---------------------------------------

// GET Route: Display Owner-Specific Listing Details
router.get(
  "/:id/detail",
  ensureAuthenticated,
  authorizeListing,
  csrfProtection,
  async (req, res) => {
    try {
      const listing = req.listing; // From authorizeListing middleware
      res.render("listingDetail", { listing, user: req.session.user, csrfToken: req.csrfToken() });
    } catch (error) {
      console.error("Error fetching listing detail:", error);
      req.flash("error", "An error occurred while fetching the listing.");
      res.redirect("/user/profile1");
    }
  }
);

// GET Route: Display Public Listing Details
router.get("/:id", csrfProtection, async (req, res) => {
  try {
    const listingId = req.params.id;

    // Validate the listing ID format
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      req.flash("error", "Invalid listing ID.");
      return res.redirect("/");
    }

    // Fetch the listing and populate seller information
    const listing = await Listing.findById(listingId)
      .populate("userId", "name email profilePic")
      .lean();

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/");
    }

    const user = req.session.user || null;
    const isSeller = user && user.id.toString() === listing.userId._id.toString();

    if (isSeller) {
      // Redirect to owner-specific detail page
      return res.redirect(`/listing/${listingId}/detail`);
    }

    // Render standard product detail page for buyers
    res.render("productDetail", { 
      product: listing, 
      user,
      csrfToken: req.csrfToken()
    });
  } catch (error) {
    console.error("Error fetching listing details:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// GET Route: List All Published Listings with Optional Pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { created: -1 },
      populate: { path: 'userId', select: 'name email profilePic' },
      lean: true,
    };

    // Fetch only published listings
    const query = { isDraft: false };

    const result = await Listing.paginate(query, options);
    res.render("index", { 
      listings: result.docs, 
      pagination: result, 
      user: req.session.user || null,
      csrfToken: req.csrfToken()
    }); // Pass listings, pagination info, user, and CSRF token to EJS
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// GET Route: View Offers for a Listing
router.get("/:id/offers", ensureAuthenticated, authorizeListing, async (req, res) => {
  try {
    const listing = req.listing; // From authorizeListing middleware

    // Fetch offers related to this listing (Offer model)
    const offers = await Offer.find({ listingId: listing._id })
      .populate("userId", "name email")
      .lean();

    // Determine the message based on offers
    let message = '';
    if (offers.length > 0) {
      message = "Offers fetched successfully!";
    } else {
      message = "No offers received yet.";
    }

    res.render("viewOffers", {
      listing,
      offers,
      user: await User.findById(req.session.user.id).lean(),
      message // Pass the message directly
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    req.flash("error", "An error occurred while fetching offers.");
    res.redirect("/user/profile1");
  }
});

// -----------------------------
// Handle Multer Errors Globally within the Router
// -----------------------------

// Handle Multer and Other Errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.flash("error", err.message);
    return res.redirect("/listing/create"); // Redirect to create form
  } else if (err) {
    req.flash("error", err.message || "An unexpected error occurred.");
    return res.redirect("/user/profile1"); // Redirect to profile page
  }
  next();
});

// EXPORT THE ROUTER

module.exports = router;
