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
    cb(null, "public/uploads/"); // Ensure this directory exists
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

// -----------------------------
// Handle Multer Errors Globally within the Router
// -----------------------------

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    req.flash("error", err.message);
    return res.redirect(req.get("Referrer") || "/");
  } else if (err) {
    req.flash("error", err.message || "An unexpected error occurred.");
    return res.redirect(req.get("Referrer") || "/");
  }
  next();
});

// ---------------------------------------
// CREATE Listing Routes
// ---------------------------------------

// GET Route: Render the Create Listing Form
router.get("/create", ensureAuthenticated, csrfProtection, async (req, res) => {
  res.render("createListing", {
    error: null,
    listing: {},
    csrfToken: req.csrfToken(),
  });
});

// POST Route: Handle Form Submission for Creating a Listing
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
      } = req.body;

      console.log("Form Data:", req.body);
      console.log("Uploaded Files:", req.files);

      // Handle uploaded photos
      let photos = [];
      if (req.files && req.files.length > 0) {
        photos = req.files.map((file) => `/uploads/${file.filename}`);
      } else {
        photos = ["/media/images/default.jpg"];
      }

      // Create a new listing document
      const newListing = new Listing({
        title,
        price: parseFloat(price), // Ensure price is a number
        category,
        location,
        condition,
        handmade: req.body.handmade || "no",
        quantity: parseInt(quantity, 10) || 1, // Ensure quantity is an integer
        delivery: req.body.delivery || "pickup",
        color: req.body.color || "N/A",
        photos,
        userId: req.session.user.id, // Correct association
        description,
      });

      // Save the listing to the database
      await newListing.save();

      // Set a success flash message
      req.flash("success", "Listing created successfully!");

      // Redirect to the user's profile page
      res.redirect("/user/profile1");
    } catch (error) {
      console.error("Error creating listing:", error);
      req.flash("error", "Failed to create listing. Please try again.");
      res.status(500).redirect("/listing/create");
    }
  }
);

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
      console.log("--- GET /listing/edit/:id ---");
      res.render("editListing", {
        listing,
        user: req.session.user || null,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error("Error fetching listing for edit:", error);
      req.flash("error", "An error occurred. Please try again.");
      res.redirect("/user/profile1");
    }
  }
);

// POST Route: Handle Form Submission for Editing a Listing
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
    // Add more validations as needed
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const listingId = req.params.id;

    console.log("--- POST /listing/edit/:id ---");
    console.log("Form Data:", req.body);
    console.log("Uploaded Files:", req.files);

    if (!errors.isEmpty()) {
      const errorMessages = errors
        .array()
        .map((err) => err.msg)
        .join(" ");
      req.flash("error", errorMessages);
      return res.status(400).redirect(`/listing/edit/${listingId}`);
    }

    try {
      const listing = req.listing;

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
      } = req.body;

      // Update listing fields with proper parsing
      listing.title = title;
      listing.price = parseFloat(price); // Ensure price is a number
      listing.category = category;
      listing.location = location;
      listing.condition = condition;
      listing.handmade = req.body.handmade || "no";
      listing.quantity = parseInt(quantity, 10) || 1; // Ensure quantity is an integer
      listing.delivery = req.body.delivery || "pickup";
      listing.color = req.body.color || "N/A";
      listing.description = description;

      // Log updated fields before saving
      console.log("Updated Listing Fields:", {
        title: listing.title,
        price: listing.price,
        category: listing.category,
        location: listing.location,
        condition: listing.condition,
        handmade: listing.handmade,
        quantity: listing.quantity,
        delivery: listing.delivery,
        color: listing.color,
        description: listing.description,
      });

      // Log existing photos before upload
      console.log("Before Upload - Existing Photos:", listing.photos);

      // Process removed photos
      const removedPhotos = req.body.removedPhotos
        ? JSON.parse(req.body.removedPhotos)
        : [];
      if (removedPhotos.length > 0) {
        console.log("Photos to be removed:", removedPhotos);
        listing.photos = listing.photos.filter(
          (photo) => !removedPhotos.includes(photo)
        );

        // Delete the removed photo files from the server
        removedPhotos.forEach((photoPath) => {
          const fullPath = path.join(__dirname, "..", "public", photoPath);
          fs.unlink(fullPath, (err) => {
            if (err) {
              console.error("Error deleting photo:", err);
            } else {
              console.log(`Deleted photo: ${photoPath}`);
            }
          });
        });

        console.log("Photos after removal:", listing.photos);
      }

      // Handle uploaded photos
      if (req.files && req.files.length > 0) {
        const existingPhotoCount = listing.photos.length;
        const newPhotoCount = req.files.length;
        const totalPhotos = existingPhotoCount + newPhotoCount;

        console.log(`Existing Photos Count: ${existingPhotoCount}`);
        console.log(`New Photos Count: ${newPhotoCount}`);
        console.log(`Total Photos after Upload: ${totalPhotos}`);

        if (totalPhotos > 5) {
          // Delete the newly uploaded files to prevent storage clutter
          req.files.forEach((file) => {
            fs.unlink(
              path.join(__dirname, "..", "public", "uploads", file.filename),
              (err) => {
                if (err) console.error("Error deleting file:", err);
                else
                  console.log(
                    `Deleted uploaded file due to exceeding limit: ${file.filename}`
                  );
              }
            );
          });

          req.flash(
            "error",
            `You can only have a maximum of 5 photos. You have already uploaded ${existingPhotoCount} photos.`
          );
          return res.redirect(`/listing/edit/${listingId}`);
        }

        // Append new photos to the existing array
        const newPhotos = req.files.map((file) => `/uploads/${file.filename}`);
        listing.photos = listing.photos.concat(newPhotos);

        console.log("After Upload - Updated Photos Array:", listing.photos);
      }

      // Log the final photos array before saving
      console.log("Final Photos Array:", listing.photos);

      // Save the updated listing
      await listing.save();

      // Confirm save operation
      console.log("Listing saved successfully.");

      // Set a success flash message
      req.flash("success", "Listing updated successfully!");

      res.redirect("/user/profile1");
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
  async (req, res) => {
    try {
      const listing = req.listing; // From authorizeListing middleware
      res.render("listingDetail", { listing, user: req.session.user });
    } catch (error) {
      console.error("Error fetching listing detail:", error);
      req.flash("error", "An error occurred while fetching the listing.");
      res.redirect("/user/profile1");
    }
  }
);

// GET Route: Display Public Listing Details
router.get("/:id", csrfProtection, async (req, res) => {
  // Added csrfProtection middleware
  try {
    const listingId = req.params.id;

    // Validate the listing ID format
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      req.flash("error", "Invalid listing ID.");
      return res.redirect("/");
    }

    const listing = await Listing.findById(listingId)
      .populate("userId") // Populate the userId field
      .lean();

    if (!listing) {
      req.flash("error", "Listing not found.");
      return res.redirect("/");
    }

    const user = req.session.user
      ? await User.findById(req.session.user.id).lean()
      : null;

    res.render("productDetail", {
      product: listing,
      user,
      csrfToken: req.csrfToken(), 
    });
  } catch (error) {
    console.error("Error fetching listing details:", error);
    req.flash("error", "An error occurred while fetching the listing.");
    res.redirect("/");
  }
});

// GET Route: View Offers for a Listing
router.get("/:id/offers", ensureAuthenticated, authorizeListing, async (req, res) => {
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
});

// EXPORT THE ROUTER

module.exports = router;
