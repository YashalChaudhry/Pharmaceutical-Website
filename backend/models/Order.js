const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [
    {
      id: String,
      name: String,
      price: String,
      quantity: Number,
      image: String
    }
  ],
  billing: {
    firstName: String,
    lastName: String,
    address: String,
    city: String,
    postalCode: String,
    phone: String
  },
  payment: {
    method: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingInfo: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    updates: [{
      status: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema); 