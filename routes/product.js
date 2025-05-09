// routes/product.js

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Listing = require("../models/Listing");
const User = require("../models/User");
const csrf = require('csurf');

// Middleware
const ensureAuthenticated = require("../middleware/auth");

// Initialize CSRF Protection
const csrfProtection = csrf();

// Route to render product detail page based on ownership
router.get("/:id", ensureAuthenticated, csrfProtection, async (req, res) => {
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

    let user = null;
    let isFavorited = false;

    if (req.session.user && req.session.user.id) {
      // Fetch the latest user data from the database
      user = await User.findById(req.session.user.id).lean();

      if (user && user.favorites) {
        // Determine if the current listing is favorited
        isFavorited = user.favorites.some(
          (favId) => favId.toString() === listingId.toString()
        );
      }

      // Optional: Update session data to keep it in sync
      req.session.user = user;
    }

    const isSeller =
      user && user.id.toString() === listing.userId._id.toString();

    if (isSeller) {
      // Render seller-specific listing detail page
      res.render("listingDetail", {
        listing,
        user,
        csrfToken: req.csrfToken(),
      });
    } else {
      // Render standard product detail page for buyers
      res.render("productDetail", {
        product: listing,
        user,
        isFavorited, // Pass this flag to the template
        csrfToken: req.csrfToken(),
      });
    }
  } catch (error) {
    console.error("Error fetching listing details:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// Route to list all products with optional pagination
router.get("/", csrfProtection, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { created: -1 },
      populate: { path: "userId", select: "name email" },
      lean: true,
    };

    const result = await Listing.paginate({}, options);
    res.render("index", {
      listings: result.docs,
      pagination: result,
      user: req.session.user || null,
      csrfToken: req.csrfToken(),
    }); // Pass listings, pagination info, and user to EJS template
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

module.exports = router;
