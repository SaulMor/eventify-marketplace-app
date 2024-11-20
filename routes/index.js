// routes/index.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing"); // Import Listing model
const User = require("../models/User"); // Import User model
const Event = require("../models/Event");
const csrf = require("csurf");
const csrfProtection = csrf();

const fs = require("fs"); // Import fs
const path = require("path"); // Import path

// Helper Function to Calculate the Nth Weekday of a Month
function getNthWeekdayOfMonth(year, month, n, weekday) {
  const firstDay = new Date(year, month - 1, 1);
  let firstWeekday = firstDay.getDay();
  let day = 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7;
  return new Date(year, month - 1, day);
}

// Helper Function to Convert Event Name to Kebab-Case (for CSS Class Naming)
const toKebabCase = (str) =>
  str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

// Home route with CSRF Protection
router.get("/", csrfProtection, async (req, res) => {
  try {
    // Fetch only listings that are not drafts
    const listings = await Listing.find({ isDraft: false }).limit(24).lean();

    const user = req.session.user
      ? await User.findById(req.session.user.id).lean()
      : null;

    // Determine current active events
    const currentDate = new Date();
    const activeEvents = await Event.find({
      "activeDates.start": { $lte: currentDate },
      "activeDates.end": { $gte: currentDate },
    }).lean();

    // For simplicity, assume only one active event at a time
    let selectedEvent = activeEvents[0] || null;

    let seasonalClass = "default";
    let seasonalText = "Check out our exclusive deals!";
    let seasonalDescription =
      "Explore our wide range of products and enjoy great discounts.";
    let seasonalButtonText = "Shop Now";
    let seasonalTargetUrl = "/shop"; // Default target URL

    if (selectedEvent) {
      // Verify if the event image exists
      const imagePath = path.join(
        __dirname,
        "..",
        "public",
        selectedEvent.image
      );
      if (fs.existsSync(imagePath)) {
        seasonalClass = toKebabCase(selectedEvent.name);
        seasonalText = selectedEvent.description || selectedEvent.text; // Use description if available
        seasonalDescription = selectedEvent.description || selectedEvent.text; // Adjust if there's a separate description
        seasonalButtonText = selectedEvent.buttonText;
        seasonalTargetUrl = selectedEvent.targetUrl; // Assign targetUrl
      } else {
        console.warn(
          `Image not found: ${selectedEvent.image}. Using default image.`
        );
        // seasonalClass remains as 'default'
        seasonalTargetUrl = "/shop"; // Fallback to default shop URL
      }
    }

    res.render("index", {
      listings, // Only listings where isDraft: false
      user,
      seasonalClass,
      seasonalText,
      seasonalDescription,
      seasonalButtonText,
      seasonalTargetUrl, // Pass targetUrl to template
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
  
// Search Route
router.get("/search", csrfProtection, async (req, res) => {
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
            csrfToken: req.csrfToken(), // Pass CSRF token to the view
            
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

// Help Center Route with CSRF Protection
router.get("/helpcenter", csrfProtection, async (req, res) => {
    try {
        const user = req.session.user
            ? await User.findById(req.session.user.id).lean()
            : null;

        res.render("helpcenter", {
            user,
            csrfToken: req.csrfToken() // Now available
           
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});
module.exports = router;
