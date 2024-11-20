// models/Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Ensure event names are unique
    },
    slug: {
        type: String,
        required: true,
        unique: true, // Used for URL paths
    },
    image: {
        type: String,
        required: true, // Path to the event banner image
    },
    description: {
        type: String,
        required: true, // Detailed description of the event
    },
    buttonText: {
        type: String,
        default: "Shop Now",
    },
    targetUrl: {
        type: String,
        default: "/shop", // URL to redirect when "Shop Now" is clicked
    },
    activeDates: {
        start: {
            type: Date,
            required: true, // When the event becomes active
        },
        end: {
            type: Date,
            required: true, // When the event ends
        },
    },
}, { timestamps: true });

// Create and export the Event model

module.exports = mongoose.model('Event', eventSchema);