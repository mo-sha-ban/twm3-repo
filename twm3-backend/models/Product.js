const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  long_description: {
    type: String
  },
  price: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  image: {
    type: String
  },
  images: {
    img1: String,
    img2: String,
    img3: String,
    img4: String,
    img5: String,
    img6: String
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'youtube', 'link'],
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  category: {
    type: String,
    default: 'general'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
      // Embedded reviews array
    reviews: [{
      user: mongoose.Schema.Types.Mixed,
      rating: Number,
      comment: String,
      createdAt: { type: Date, default: Date.now },
      likes: [String]
    }],

    // Embedded comments array
    comments: [{
      user: mongoose.Schema.Types.Mixed,
      text: String,
      createdAt: { type: Date, default: Date.now },
      likes: [String]
    }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);