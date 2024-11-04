// models/Listing.js

const mongoose = require('mongoose'); 
const mongoosePaginate = require('mongoose-paginate-v2'); // If using pagination

const listingSchema = new mongoose.Schema({ 
    title: { type: String, required: true }, 
    price: { type: Number, required: true }, 
    category: { type: String, required: false },
    location: { type: String, required: false },
    handmade: { type: String, required: false }, 
    quantity: { type: Number, default: 1 }, 
    delivery: { type: String, default: 'pickup' },
    color: { type: String, default: 'N/A' }, 
    photos: [{ type: String }], 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true }, 
    created: { type: Date, default: Date.now },
    condition: { type: String, required: false }
});

// Apply the mongoose-paginate-v2 plugin if using pagination
listingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Listing', listingSchema);
