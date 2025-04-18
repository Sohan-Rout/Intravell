const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Guide = require('../models/Guide');

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const { guideId, startDate, endDate, numberOfPeople, notes, itineraryId } = req.body;
    
    // Calculate total cost based on guide's hourly rate and duration
    const guide = await Guide.findOne({ id: guideId });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    
    // Calculate hours between start and end date
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    // Calculate total cost
    const totalCost = guide.hourlyRate * hours * numberOfPeople;
    
    const booking = new Booking({
      id: `booking_${Date.now()}`,
      guideId,
      touristId: req.body.touristId || 'default_tourist', // In a real app, this would come from auth
      startDate,
      endDate,
      numberOfPeople,
      notes,
      itineraryId,
      totalCost,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await booking.save();
    
    // Increment the guide's request count
    guide.requestCount = (guide.requestCount || 0) + 1;
    await guide.save();
    
    res.status(201).json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findOne({ id: req.params.id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookings by tourist ID
router.get('/tourist/:touristId', async (req, res) => {
  try {
    const bookings = await Booking.find({ touristId: req.params.touristId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookings by guide ID
router.get('/guide/:guideId', async (req, res) => {
  try {
    const bookings = await Booking.find({ guideId: req.params.guideId });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { id: req.params.id },
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel a booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { id: req.params.id },
      { status: 'cancelled', updatedAt: new Date() },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 