const express = require('express');
const router = express.Router();
const Messages = require('../models/Messages');

// Handling route for messages/offers
router.post('/', async (req, res) => { 
    try {  
        const { productId, message } = req.body;

        // Create a new message with the provided productId and message content
        const newMessage = new Messages({ productId, message });

        // Save the message to the database
        await newMessage.save();

        // Redirect to the user's profile page after successful submission
        res.redirect('/user/profile1');
    } catch (err) { 
        console.error("Error sending message:", err); 
        res.status(500).send("Error sending message");
    }
});

module.exports = router;
