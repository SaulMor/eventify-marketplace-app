// routes/events.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing"); // Import Listing model
const User = require("../models/User"); // Import User model
const csrf = require('csurf');
const csrfProtection = csrf();

// Define Seasons and Specials (Same as in index.js)
const events = [
    {
        name: "New Year",
        months: [1], // January
        image: "/media/images/newyear-banner.jpg",
        text: "New Year Specials! Start your year with amazing deals.",
        buttonText: "Shop Now",
    },
    {
        name: "Valentine's Day",
        months: [2], // February
        image: "/media/images/valentines-banner.jpg",
        text: "Valentine's Day Deals! Show your love with our exclusive offers.",
        buttonText: "Shop Now",
    },
    {
        name: "Easter",
        months: [4], // April
        image: "/media/images/easter-banner.jpg",
        text: "Easter Specials! Hop into our fantastic deals.",
        buttonText: "Shop Now",
    },
    {
        name: "Halloween",
        months: [10], // October
        image: "/media/images/halloween-banner.jpg",
        text: "Halloween Specials! Get ready for the spookiest deals.",
        buttonText: "Shop Now",
    },
    {
        name: "Thanksgiving",
        months: [11], // November
        image: "/media/images/thanksgiving-banner.jpg",
        text: "Thanksgiving Deals! Give thanks with our exclusive offers.",
        buttonText: "Shop Now",
        targetUrl: "/events/thanksgiving"
    },
    {
        name: "Black Friday",
        months: [11], // November
        image: "/media/images/blackfriday-banner.jpg",
        text: "Black Friday Specials! Unbeatable prices just for you.",
        buttonText: "Shop Now",
    },
    {
        name: "Cyber Monday",
        months: [11], // November
        image: "/media/images/cybermonday-banner.jpg",
        text: "Cyber Monday Deals! Shop the best online offers.",
        buttonText: "Shop Now",
    },
    {
        name: "Christmas",
        months: [12], // December
        image: "/media/images/christmas-banner.jpg",
        text: "Christmas Deals! Up to 40% off on all items.",
        buttonText: "Shop Now",
    },
    // Add more seasons/events as needed
];

// Helper Function to Convert Event Name to Kebab-Case
const toKebabCase = (str) => str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// Event-specific route
router.get("/:eventName", csrfProtection, async (req, res) => {
    try {
        const eventName = req.params.eventName;
        const event = events.find(e => toKebabCase(e.name) === eventName);

        if (!event) {
            return res.status(404).render("404", { message: "Event not found." });
        }

        const listings = await Listing.find({ event: event.name }).lean();

        const user = req.session.user
            ? await User.findById(req.session.user.id).lean()
            : null;

        res.render("eventPage", {
            event,
            listings,
            user,
            csrfToken: req.csrfToken() // Pass CSRF token
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
