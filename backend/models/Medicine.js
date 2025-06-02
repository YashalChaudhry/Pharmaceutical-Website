const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  image: {
    data: Buffer,
    contentType: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Medicine', medicineSchema);
