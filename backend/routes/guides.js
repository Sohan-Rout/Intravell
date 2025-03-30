const express = require('express');
const router = express.Router();
const Guide = require('../models/Guide');

// Create a new guide profile
router.post('/', async (req, res) => {
  try {
    const guide = new Guide({
      ...req.body,
      id: `guide_${Date.now()}`,
      rating: 0,
      totalTours: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await guide.save();
    res.status(201).json(guide);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a guide profile by ID
router.get('/:id', async (req, res) => {
  try {
    const guide = await Guide.findOne({ id: req.params.id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    res.json(guide);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a guide profile
router.put('/:id', async (req, res) => {
  try {
    const guide = await Guide.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    res.json(guide);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get guides by city
router.get('/', async (req, res) => {
  try {
    const { city } = req.query;
    const guides = city ? await Guide.find({ city }) : await Guide.find();
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update guide rating
router.put('/:id/rating', async (req, res) => {
  try {
    const guide = await Guide.findOne({ id: req.params.id });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }

    const { newRating } = req.body;
    const updatedRating = (guide.rating * guide.totalTours + newRating) / (guide.totalTours + 1);

    guide.rating = updatedRating;
    guide.totalTours += 1;
    guide.updatedAt = new Date();

    await guide.save();
    res.json(guide);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Search guides
router.get('/search', async (req, res) => {
  try {
    const { city, languages, minRating, maxPrice } = req.query;
    const filter = {};

    if (city) filter.city = city;
    if (languages) filter.languages = { $in: languages.split(',') };
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };
    if (maxPrice) filter.hourlyRate = { $lte: parseFloat(maxPrice) };

    const guides = await Guide.find(filter);
    res.json(guides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 