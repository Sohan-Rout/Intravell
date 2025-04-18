const mongoose = require('mongoose');

const touristAuthSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  nationality: {
    type: String,
    required: true,
    trim: true
  },
  hasProfile: {
    type: Boolean,
    default: false
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

// Update the updatedAt timestamp before saving
touristAuthSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const TouristAuth = mongoose.model('TouristAuth', touristAuthSchema);

module.exports = TouristAuth; 