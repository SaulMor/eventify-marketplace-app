// routes/product.js

const express = require("express");
const router = express.Router();

// Placeholder for product data (static for now)
// Later, replace this with database queries
const products = [
  {
    id: "1",
    name: "Wedding Chiffon Chair Sashes",
    price: "$14",
    originalPrice: "$39",
    brand: "None",
    description: "Elegant chiffon chair sashes perfect for wedding decor.",
    colors: ["White", "Blue", "Red", "Green"],
    images: [
      "/media/images/weddingdecor.jpg", // Updated image path
      "/media/images/weddingdecor.jpg",
      "/media/images/weddingdecor.jpg",
    ],
    category: "Weddings",
  },
  // Add more products as needed
];

// Route to render product detail page
router.get("/:id", (req, res) => {
  const productId = req.params.id;
  const product = products.find((p) => p.id === productId);

  if (product) {
    res.render("productDetail", { product }); // Pass product data to EJS template
  } else {
    res.status(404).render("404"); 
  }
});

// Optional: Route to list all products
router.get("/", (req, res) => {
  res.render("productList", { products }); // Create a productList.ejs view to display all products
});

module.exports = router;
