// routes/events.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing"); // Import Listing model
const User = require("../models/User"); // Import User model
const Event = require('../models/Event');
const csrf = require('csurf');
const csrfProtection = csrf();

// Event-specific route
router.get("/:eventSlug", csrfProtection, async (req, res) => {
    try {
        const eventSlug = req.params.eventSlug.toLowerCase();

        // Fetch the event by slug
        const event = await Event.findOne({ slug: eventSlug }).lean();

        if (!event) {
            req.flash("error", "Event not found.");
            return res.status(404).render("404", { message: "Event not found." });
        }

        // Check if the event is currently active
        const currentDate = new Date();
        if (currentDate < event.activeDates.start || currentDate > event.activeDates.end) {
            req.flash("error", "This event is not currently active.");
            return res.redirect("/");
        }

        // Fetch listings associated with this event
        const listings = await Listing.find({ event: event._id, isDraft: false }).lean();

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
