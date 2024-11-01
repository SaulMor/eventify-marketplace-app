// routes/protected.js

const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middleware/firebaseAuth');

// Example Protected Route
router.get('/dashboard', verifyFirebaseToken, (req, res) => {
    res.render('dashboard', { user: req.user });
});

// Add more protected routes as needed

module.exports = router;
