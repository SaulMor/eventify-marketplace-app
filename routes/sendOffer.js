const express = require('express');
const router = express.Router();
const Messages = require('../models/Messages');

// Handling route for messages/offers
router.post('/', async (req, res) => { 
    try {  
        const { productId, message } = req.body;
        const newMessage = new Messages({ productId, message });

        await newMessage.save();
       
        res.redirect('/user/profile1');
    } catch (err) { 
        console.error("Error sending message:", err); 
        res.status(500).send("Error sending message");
    }
});

module.exports = router;
