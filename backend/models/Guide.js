const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  city: { type: String, required: true },
  languages: [{ type: String }],
  experience: { type: String, required: true },
  hourlyRate: { type: Number, required: true },
  bio: { type: String },
  profileImage: { type: String, required: true },
  rating: { type: Number, default: 0 },
  totalTours: { type: Number, default: 0 },
  requestCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Guide', guideSchema); 