// routes/index.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing"); // Import Listing model
const User = require("../models/User"); // Import User model
const csrf = require("csurf");
const csrfProtection = csrf();

const fs = require('fs'); // Import fs
const path = require('path'); // Import path

// Define Seasons and Specials
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

// Helper Function to Calculate the Nth Weekday of a Month
function getNthWeekdayOfMonth(year, month, n, weekday) {
    const firstDay = new Date(year, month - 1, 1);
    let firstWeekday = firstDay.getDay();
    let day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
    return new Date(year, month - 1, day);
}

// Home route
router.get("/", async (req, res) => {
    try {
        const listings = await Listing.find().limit(24).lean();
        const user = req.session.user
            ? await User.findById(req.session.user.id).lean()
            : null;

        // Determine current season or event
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
        const currentDay = currentDate.getDate();
        const currentYear = currentDate.getFullYear();

        let seasonalImage = "/media/images/default-seasonal.jpg";
        let seasonalText = "Check out our exclusive deals!";
        let seasonalButtonText = "Shop Now";

        // Find all events for the current month
        const currentMonthEvents = events.filter((event) =>
            event.months.includes(currentMonth)
        );

        let selectedEvent = null;

        currentMonthEvents.forEach((event) => {
            if (event.name === "Thanksgiving") {
                // Calculate Thanksgiving (4th Thursday of November)
                const thanksgiving = getNthWeekdayOfMonth(currentYear, 11, 4, 4); // 4th Thursday
                if (
                    currentDate.toDateString() === thanksgiving.toDateString()
                ) {
                    selectedEvent = event;
                }
            } else if (event.name === "Black Friday") {
                // Black Friday is the day after Thanksgiving
                const thanksgiving = getNthWeekdayOfMonth(currentYear, 11, 4, 4); // 4th Thursday
                const blackFriday = new Date(thanksgiving);
                blackFriday.setDate(blackFriday.getDate() + 1);
                if (
                    currentDate.toDateString() === blackFriday.toDateString()
                ) {
                    selectedEvent = event;
                }
            } else if (event.name === "Cyber Monday") {
                // Cyber Monday is the Monday after Black Friday
                const thanksgiving = getNthWeekdayOfMonth(currentYear, 11, 4, 4); // 4th Thursday
                const blackFriday = new Date(thanksgiving);
                blackFriday.setDate(blackFriday.getDate() + 1);
                const cyberMonday = new Date(blackFriday);
                cyberMonday.setDate(cyberMonday.getDate() + 3);
                if (
                    currentDate.toDateString() === cyberMonday.toDateString()
                ) {
                    selectedEvent = event;
                }
            } else {
                // For other events, simply check the month
                selectedEvent = event;
            }
        });

        // If no specific event is active, select the first event for the month if available
        if (!selectedEvent && currentMonthEvents.length > 0) {
            selectedEvent = currentMonthEvents[0];
        }

        if (selectedEvent) {
            const imagePath = path.join(__dirname, '..', 'public', selectedEvent.image);
            if (fs.existsSync(imagePath)) {
                seasonalImage = selectedEvent.image;
                seasonalText = selectedEvent.text;
                seasonalButtonText = selectedEvent.buttonText;
                console.log(`Selected Event: ${selectedEvent.name}`);
                console.log(`Using Image: ${seasonalImage}`);
            } else {
                console.warn(`Image not found: ${selectedEvent.image}. Using default image.`);
                // seasonalImage remains as default-seasonal.jpg
            }
        } else {
            console.log('No specific event selected. Using default seasonal image.');
        }

        res.render("index", {
            listings,
            user,
            seasonalImage,
            seasonalText,
            seasonalButtonText,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Search Route
router.get("/search", async (req, res) => {
    const query = req.query.query;
    if (!query) {
        req.flash("error", "Please enter a search term.");
        return res.redirect("/");
    }

    try {
        // Simple search: find listings where title or description contains the query
        const listings = await Listing.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        }).lean();

        const user = req.session.user
            ? await User.findById(req.session.user.id).lean()
            : null;

        res.render("searchResults", {
            listings,
            user,
            query,
        });
    } catch (error) {
        console.error(error);
        req.flash("error", "An error occurred while searching.");
        res.redirect("/");
    }
});

// Sign-up route (already handled in auth.js)
router.get("/signup", csrfProtection, (req, res) => {
    res.render("signup", {
        title: "Sign Up",
        csrfToken: req.csrfToken(),
    }); // Render from /views/signup.ejs
});

// Login route (already handled in auth.js)
router.get("/login", csrfProtection, (req, res) => {
    res.render("login", {
        title: "Login",
        csrfToken: req.csrfToken(),
    }); // Render from /views/login.ejs
});

module.exports = router;
