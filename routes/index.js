// routes/index.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing"); // Import Listing model
const csrf = require('csurf');
const csrfProtection = csrf();

// Home route
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find({})
      .sort({ created: -1 })
      .limit(8)
      .lean(); // Fetch latest 8 listings
    res.render("index", {
      title: "Home Page",
      user: req.session.user || null,
      listings,
      // csrfToken is not passed unless there's a form
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// Sign-up route (already handled in auth.js)
router.get("/signup", csrfProtection, (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    // csrfToken is already available via auth.js
  }); // Render from /views/signup.ejs
});

// Login route (already handled in auth.js)
router.get("/login", csrfProtection, (req, res) => {
  res.render("login", {
    title: "Login",
    // csrfToken is already available via auth.js
  }); // Render from /views/login.ejs
});

module.exports = router;
