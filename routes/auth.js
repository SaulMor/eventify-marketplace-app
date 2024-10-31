// routes/auth.js

const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const User = require("../models/User");

// Display Login Page
router.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    formData: {},
    csrfToken: res.locals.csrfToken, // Pass csrfToken to EJS
    error: req.session.error || null,
    success: req.session.success || null,
  });
  // Clear the error and success after displaying
  req.session.error = null;
  req.session.success = null;
});

// Display Signup Page
router.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Sign Up",
    formData: {},
    csrfToken: res.locals.csrfToken, // Pass csrfToken to EJS
    error: req.session.error || null,
    success: req.session.success || null,
  });
  // Clear the error and success after displaying
  req.session.error = null;
  req.session.success = null;
});

// Handle Signup Form Submission
router.post("/signup", async (req, res) => {
  try {
    const { name, email, firebaseUid, idToken } = req.body;

    console.log("Received signup request:", {
      name,
      email,
      firebaseUid,
      idToken,
    });

    // Validate input
    if (!name || !email || !firebaseUid || !idToken) {
      console.error("Signup validation failed: Missing fields");
      return res.status(400).json({ error: "All fields are required." });
    }

    // Verify the ID token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    if (uid !== firebaseUid) {
      console.error("Signup validation failed: UID mismatch");
      return res.status(400).json({ error: "Invalid authentication token." });
    }

    // Check if user already exists in local DB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("Signup validation failed: Email already exists");
      return res.status(400).json({ error: "Email already exists." });
    }

    // Create local user record
    const newUser = await User.create({
      name,
      email,
      firebaseUid: firebaseUid,
    });

    console.log("User created in MongoDB:", newUser);

    return res
      .status(201)
      .json({ success: "Registration successful. Please log in." });
  } catch (err) {
    console.error("Error during signup:", err);
    return res.status(500).json({ error: "Registration failed." });
  }
});

// Handle Login Form Submission
router.post("/login", async (req, res) => {
  try {
    const { idToken } = req.body; // Expecting idToken from client

    if (!idToken) {
      console.error("Login failed: No ID token provided");
      return res.status(400).json({ error: "ID token is required." });
    }

    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    // Find the user in MongoDB
    let user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      // Optionally, create a new user in MongoDB if not found
      user = await User.create({
        name: name || "Unnamed",
        email: email,
        firebaseUid: uid,
      });
    }

    // Set user info in session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      firebaseUid: user.firebaseUid,
    };

    console.log("User logged in:", req.session.user);

    return res.status(200).json({ success: "Login successful." });
  } catch (err) {
    console.error("Error during login:", err);
    return res.status(500).json({ error: "Login failed." });
  }
});

// Handle Logout
router.post("/logout", (req, res) => {
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
