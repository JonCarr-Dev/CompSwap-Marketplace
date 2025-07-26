const mongoose = require('mongoose')

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor']

const listingSchema = new mongoose.Schema({
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },

  title: { 
    type: String, 
    required: true 
  },

  description: { 
    type: String, 
    required: true 
  },

  price: { 
    type: Number, 
    required: true 
  },

  category: { 
    type: String,
    enum: [
      'CPU', 'CPU Cooler', 'Motherboard', 'Memory',
      'Storage', 'GPU', 'PSU', 'Case', 'Case Fan',
      'Thermal Paste', 'Other'
    ],
    required: true 
  },

  condition: {
    type: String,
    enum: CONDITIONS,
    required: true
  },

  imageUrl: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Listing', listingSchema)