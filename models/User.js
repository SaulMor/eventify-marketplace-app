// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Enforce unique emails
    lowercase: true,
    trim: true,
  },
  firebaseUid: {
    type: String,
    required: true,
    unique: true, // Enforce unique Firebase UIDs
  },
  joined: {
    type: Date,
    default: Date.now,
  },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  cart: [
    {
      listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
      quantity: { type: Number, default: 1, min: 1 },
    },
  ],
});

module.exports = mongoose.model('User', userSchema);
