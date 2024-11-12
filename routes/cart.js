// routes/cart.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const csrf = require('csurf');
const csrfProtection = csrf();

const User = require('../models/User');
const Listing = require('../models/Listing');

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.id) {
    return next();
  }
  req.flash('error', 'You need to be logged in to access this page.');
  res.redirect('/auth/login');
}

// POST /cart/add - Add Item to Cart
router.post('/add', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const { listingId, quantity } = req.body;
    const userId = req.session.user.id;

    // Validate input
    if (!listingId || !quantity) {
      return res.status(400).json({ error: 'Listing ID and quantity are required.' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: 'Invalid quantity specified.' });
    }

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    // Fetch the listing from the database
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // Check if the requested quantity is available
    if (listing.quantity < qty) {
      return res.status(400).json({ error: `Only ${listing.quantity} items available.` });
    }

    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Initialize cart if it doesn't exist
    if (!user.cart) {
      user.cart = [];
    }

    // Check if the listing is already in the cart
    const existingCartItem = user.cart.find(item => item.listing.toString() === listingId);

    if (existingCartItem) {
      // Update the quantity of the existing cart item
      existingCartItem.quantity += qty;
    } else {
      // Add new cart item
      user.cart.push({
        listing: listingId,
        quantity: qty,
      });
    }

    // Decrease the listing's available quantity
    listing.quantity -= qty;

    // Save the updated listing and user
    await listing.save();
    await user.save();

    // Update session data - only the cart field
    req.session.user.cart = user.cart;

    // Calculate the total cart count
    const cartCount = user.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({ success: 'Item added to cart successfully.', cartCount });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'An error occurred while adding the item to your cart.' });
  }
});

// POST /cart/remove - Remove Item from Cart
router.post('/remove', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const { listingId } = req.body;
    const userId = req.session.user.id;

    // Validate input
    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID is required.' });
    }

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    // Fetch the user from the database
    const user = await User.findById(userId).populate('cart.listing');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Find the cart item
    const cartItemIndex = user.cart.findIndex(item => item.listing._id.toString() === listingId);
    if (cartItemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }

    const cartItem = user.cart[cartItemIndex];
    const listingName = cartItem.listing.name; // Assuming 'name' field exists in Listing model
    const qtyToRestore = cartItem.quantity;

    // Remove the item from the cart
    user.cart.splice(cartItemIndex, 1);

    // Restore the stock in the listing
    const listing = await Listing.findById(listingId);
    if (listing) {
      listing.quantity += qtyToRestore;
      await listing.save();
    }

    // Save the updated user
    await user.save();

    // Update session data - only the cart field
    req.session.user.cart = user.cart;

    // Calculate the total cart count
    const cartCount = user.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({ 
      success: 'Item removed from cart successfully.', 
      cartCount,
      listingName // Include the name of the removed listing
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'An error occurred while removing the item from your cart.' });
  }
});

// POST /cart/update - Update Item Quantity in Cart
router.post('/update', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const { listingId, quantity } = req.body;
    const userId = req.session.user.id;

    // Validate input
    if (!listingId || !quantity) {
      return res.status(400).json({ error: 'Listing ID and quantity are required.' });
    }

    const newQty = parseInt(quantity, 10);
    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ error: 'Invalid quantity specified.' });
    }

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    // Fetch the user from the database
    const user = await User.findById(userId).populate('cart.listing');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Find the cart item
    const cartItem = user.cart.find(item => item.listing._id.toString() === listingId);
    if (!cartItem) {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }

    const currentQty = cartItem.quantity;

    if (newQty > currentQty) {
      const qtyDifference = newQty - currentQty;
      // Check if additional quantity is available
      if (cartItem.listing.quantity < qtyDifference) {
        return res.status(400).json({ error: `Only ${cartItem.listing.quantity} additional items available.` });
      }
      // Update the quantity
      cartItem.quantity = newQty;
      // Decrease the listing's available quantity
      cartItem.listing.quantity -= qtyDifference;
    } else if (newQty < currentQty) {
      const qtyDifference = currentQty - newQty;
      // Update the quantity
      cartItem.quantity = newQty;
      // Increase the listing's available quantity
      cartItem.listing.quantity += qtyDifference;
    } else {
      // Quantity remains unchanged
      return res.status(200).json({ message: 'Quantity remains unchanged.', cartCount: user.cart.reduce((acc, item) => acc + item.quantity, 0) });
    }

    // Save the updated listing and user
    await cartItem.listing.save();
    await user.save();

    // Update session data - only the cart field
    req.session.user.cart = user.cart;

    // Calculate the total cart count
    const cartCount = user.cart.reduce((acc, item) => acc + item.quantity, 0);

    res.status(200).json({ success: 'Cart updated successfully.', cartCount });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'An error occurred while updating your cart.' });
  }
});

// GET /cart - View Cart
router.get('/', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Fetch user with populated cart listings and their respective sellers
    const user = await User.findById(userId)
      .populate({
        path: 'cart.listing',
        model: 'Listing',
        populate: {
          path: 'userId',
          model: 'User',
          select: 'name profilePic', // Select only necessary fields
        },
      })
      .lean();

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/');
    }

    // Filter out cart items with invalid listings or prices
    const validCart = user.cart.filter(item =>
      item.listing &&
      typeof item.listing.price === 'number' &&
      item.listing.price >= 0
    );

    // Determine if any items were removed
    const removedItems = user.cart.length - validCart.length;

    // Update the user's cart to only contain valid items
    if (removedItems > 0) {
      await User.findByIdAndUpdate(userId, { cart: validCart });
      // Update session data - only the cart field
      req.session.user.cart = validCart;
      req.flash('error', 'Some items in your cart are no longer available and have been removed.');
    }

    // Calculate the total items and total price
    let totalItems = 0;
    let totalPrice = 0;

    validCart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.listing.price * item.quantity;
    });

    // Render the cart view with cart data
    res.render('cart', {
      user,
      cart: validCart, // Pass only valid cart items
      csrfToken: req.csrfToken(),
      success: req.flash("success"),
      error: req.flash("error"),
      totalItems,
      totalPrice: totalPrice.toFixed(2) 
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    req.flash('error', 'An error occurred while fetching your cart.');
    res.redirect('/');
  }
});

module.exports = router;
