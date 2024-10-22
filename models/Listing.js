const mongoose = require('mongoose'); 

const listingSchema = new mongoose.Schema({ 
    title: { type: String, require: true }, 
    price: { type: Number, require: true}, 
    category: { type: String, required: true},
    location: { type: String},
    handmade: {type: String, required: false}, 
    quantity: {type: Number}, 
    delivery: {type: String},
    color: {type: String}, 
    photos: [{type: String}], 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    description: { type: String, require: false}, 
    created: { type:Date, default: Date.now}
}); 


module.exports = mongoose.model('Listing', listingSchema); 


