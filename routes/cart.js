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
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'You need to be logged in to access this page.');
  res.redirect('/auth/login');
}

// GET /cart - View Cart
router.get('/', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Fetch user with populated cart listings
    const user = await User.findById(userId)
      .populate({
        path: 'cart.listing',
        model: 'Listing',
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

    // Optional: Notify the user about removed items
    if (validCart.length !== user.cart.length) {
      req.flash('error', 'Some items in your cart are no longer available and have been removed.');
    }

    // Log validCart for debugging purposes
    console.log('Valid Cart Items:', validCart);

    // Render the cart view with cart data
    res.render('cart', {
      user,
      cart: validCart, // Pass only valid cart items
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    req.flash('error', 'An error occurred while fetching your cart.');
    res.redirect('/');
  }
});

// POST /cart/add - Add Item to Cart
router.post('/add', ensureAuthenticated, csrfProtection, async (req, res) => {
  try {
    const { listingId, quantity } = req.body;
    const userId = req.session.user.id;

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    const user = await User.findById(userId);

    // Check if the listing is already in the cart
    const existingCartItem = user.cart.find(item => item.listing.toString() === listingId);

    if (existingCartItem) {
      // Update quantity
      existingCartItem.quantity += parseInt(quantity, 10);
    } else {
      // Add new cart item
      user.cart.push({
        listing: listingId,
        quantity: parseInt(quantity, 10),
      });
    }

    await user.save();

    res.status(200).json({ success: 'Item added to cart successfully.' });
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

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    const user = await User.findById(userId);

    // Remove the item from the cart
    user.cart = user.cart.filter(item => item.listing.toString() !== listingId);

    await user.save();

    res.status(200).json({ success: 'Item removed from cart successfully.' });
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

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID.' });
    }

    const user = await User.findById(userId);

    const cartItem = user.cart.find(item => item.listing.toString() === listingId);
    if (!cartItem) {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }

    // Update quantity
    cartItem.quantity = parseInt(quantity, 10);

    await user.save();

    res.status(200).json({ success: 'Cart updated successfully.' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'An error occurred while updating your cart.' });
  }
});

module.exports = router;
