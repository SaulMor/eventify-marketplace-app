// models/User.js
const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({ 
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    firebaseUid: { type: String, required: true, unique: true }, // Link to Firebase UID
    joined: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
