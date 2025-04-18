const mongoose = require('mongoose');

const guideRequestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  guideId: { type: String, required: true },
  touristId: { type: String, required: true },
  touristName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  numberOfPeople: { type: Number, required: true },
  notes: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GuideRequest', guideRequestSchema); 