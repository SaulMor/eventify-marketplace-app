// routes/auth.js

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const User = require("../models/User");
const axios = require("axios"); // Ensure axios is installed: npm install axios
const csrf = require('csurf');
const csrfProtection = csrf();

// Display Signup Page
router.get("/signup", csrfProtection, (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    formData: {},
    csrfToken: req.csrfToken(), // Pass csrfToken to EJS
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// Display Login Page
router.get("/login", csrfProtection, (req, res) => {
  res.render("login", {
    title: "Login",
    formData: {},
    csrfToken: req.csrfToken(), // Pass csrfToken to EJS
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// Handle Signup Form Submission
router.post("/signup", csrfProtection, async (req, res) => {
  try {
    const { idToken, name } = req.body;

    if (!idToken || !name) {
      console.error("Signup failed: Missing idToken or name");
      return res.status(400).json({ error: "Invalid signup request." });
    }

    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    if (!email) {
      console.error("Signup failed: Email not found in token");
      return res.status(400).json({ error: "Email not found. Please try again." });
    }

    // Check if user already exists in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      console.error("Signup failed: User already exists in MongoDB");
      return res.status(400).json({ error: "User already exists." });
    }

    // Create local user record
    user = await User.create({
      name,
      email: email.toLowerCase(),
      firebaseUid: uid,
    });

    console.log("User created in MongoDB:", user);

    return res.status(201).json({ success: "Registration successful. Please log in." });
  } catch (err) {
    console.error("Error during signup:", err);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// Handle Login Form Submission
router.post("/login", csrfProtection, async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      console.error("Login failed: Missing idToken");
      return res.status(400).json({ error: "Invalid login request." });
    }

    // Verify the ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    if (!uid || !email) {
      console.error("Login failed: Invalid token data");
      return res.status(400).json({ error: "Invalid login credentials." });
    }

    // Find the user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // If user doesn't exist, create a new local user record
      user = await User.create({
        name: name || "Unnamed",
        email: email.toLowerCase(),
        firebaseUid: uid,
      });

      console.log("User created in MongoDB during login:", user);
    }

    // Set user info in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      firebaseUid: user.firebaseUid,
    };

    console.log("User logged in and session set:", req.session.user);

    return res.status(200).json({ success: "Logged in successfully!" });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Handle Logout
router.post("/logout", csrfProtection, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ error: "Logout failed." });
    }
    res.clearCookie("connect.sid"); // Assuming default cookie name
    return res.status(200).json({ success: "Logout successful." });
  });
});

module.exports = router;
