// routes/favorites.js

const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middleware/auth");
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

const User = require("../models/User");
const Listing = require("../models/Listing");

// GET /favorites - View Saved Listings
router.get("/", ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Extract filter query parameters
    const searchQuery = req.query.search ? req.query.search.toLowerCase() : "";
    const sortOption = req.query.sort || "";
    const selectedCategories = req.query.categories
      ? Array.isArray(req.query.categories)
        ? req.query.categories
        : [req.query.categories]
      : [];
    const selectedColors = req.query.colors
      ? Array.isArray(req.query.colors)
        ? req.query.colors
        : [req.query.colors]
      : [];
    const selectedPrice = req.query.price || "";
    const customPrice = {
      minPrice: req.query.minPrice || "",
      maxPrice: req.query.maxPrice || "",
    };

    // Populate favorites with listing details and populate userId.name
    const user = await User.findById(userId)
      .populate({
        path: "favorites",
        populate: { path: "userId", select: "name" }, // Populate userId with name
      })
      .lean();

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/");
    }

    // Start with all favorite listings
    let listings = user.favorites;

    // Apply search filter if applicable
    if (searchQuery) {
      listings = listings.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchQuery) ||
          listing.category.toLowerCase().includes(searchQuery) ||
          (listing.description &&
            listing.description.toLowerCase().includes(searchQuery))
      );
    }

    // Apply category filters if any
    if (selectedCategories.length > 0) {
      listings = listings.filter((listing) =>
        selectedCategories.includes(listing.category)
      );
    }

    // Apply color filters if any
    if (selectedColors.length > 0) {
      listings = listings.filter((listing) => {
        if (!listing.colors || !Array.isArray(listing.colors)) return false;
        return listing.colors.some((color) => selectedColors.includes(color));
      });
    }

    // Apply price filters if any
    if (selectedPrice || (customPrice.minPrice && customPrice.maxPrice)) {
      listings = listings.filter((listing) => {
        const price = listing.price;
        switch (selectedPrice) {
          case "under25":
            return price < 25;
          case "25-50":
            return price >= 25 && price <= 50;
          case "50-75":
            return price >= 50 && price <= 75;
          case "100+":
            return price > 100;
          case "all":
            return true;
          default:
            return true;
        }
      });

      // Apply custom price range if provided
      if (customPrice.minPrice && customPrice.maxPrice) {
        const min = parseFloat(customPrice.minPrice);
        const max = parseFloat(customPrice.maxPrice);
        if (!isNaN(min) && !isNaN(max)) {
          listings = listings.filter(
            (listing) => listing.price >= min && listing.price <= max
          );
        }
      }
    }

    // Apply sorting if applicable
    if (sortOption) {
      switch (sortOption) {
        case "price-asc":
          listings.sort((a, b) => a.price - b.price);
          break;
        case "price-desc":
          listings.sort((a, b) => b.price - a.price);
          break;
        case "date-newest":
          listings.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "date-oldest":
          listings.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
          break;
        // Add more sort options as needed
        default:
          break;
      }
    }

    res.render("favorites", {
      favorites: listings,
      csrfToken: req.csrfToken(),
      success: req.flash("success"),
      error: req.flash("error"),
      search: req.query.search || "",
      sort: sortOption,
      selectedCategories,
      selectedColors,
      selectedPrice,
      customPrice,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    req.flash("error", "An error occurred while fetching your favorites.");
    res.redirect("/user/profile1");
  }
});

// POST /favorites/add/:listingId - Add Listing to Favorites
router.post(
  "/add/:listingId",
  ensureAuthenticated,
  csrfProtection,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const listingId = req.params.listingId;

      // Check if the listing exists
      const listing = await Listing.findById(listingId);
      if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("back");
      }

      // Find the user
      const user = await User.findById(userId);

      // Check if the listing is already in favorites
      if (user.favorites.includes(listingId)) {
        req.flash("error", "Listing is already in your favorites.");
        return res.redirect("back");
      }

      // Add to favorites
      user.favorites.push(listingId);
      await user.save();

      req.flash("success", "Listing added to your favorites.");
      res.redirect("back");
    } catch (error) {
      console.error("Error adding to favorites:", error);
      req.flash("error", "An error occurred while adding to favorites.");
      res.redirect("back");
    }
  }
);

// POST /favorites/remove/:listingId - Remove Listing from Favorites
router.post(
  "/remove/:listingId",
  ensureAuthenticated,
  csrfProtection,
  async (req, res) => {
    try {
      const userId = req.session.user.id;
      const listingId = req.params.listingId;

      // Remove the listing from user's favorites
      await User.findByIdAndUpdate(userId, { $pull: { favorites: listingId } });

      req.flash("success", "Listing removed from your favorites.");
      res.redirect("/favorites");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      req.flash("error", "An error occurred while removing from favorites.");
      res.redirect("back");
    }
  }
);

module.exports = router;
