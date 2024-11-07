const mongoose = require('mongoose');
const Schema = mongoose.Schema; 

const messageSchema = new Schema ({ 
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  });


module.exports = mongoose.model('Messages', messageSchema); 