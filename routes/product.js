// routes/product.js

const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing"); // Import Listing model

// Route to render product detail page
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const listing = await Listing.findById(productId).populate('userId', 'name email').lean();

    if (listing) {
      res.render("productDetail", { 
        product: listing, 
        user: req.session.user || null 
      }); // Pass product data and user to EJS template
    } else {
      res.status(404).render("404", { message: "Product not found." });
    }
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

// Route to list all products with optional pagination
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { created: -1 },
      populate: { path: 'userId', select: 'name email' },
      lean: true,
    };

    const result = await Listing.paginate({}, options);
    res.render("productList", { 
      products: result.docs, 
      pagination: result, 
      user: req.session.user || null 
    }); // Pass products, pagination info, and user to EJS template
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
});

module.exports = router;
