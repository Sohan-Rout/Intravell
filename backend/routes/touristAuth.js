const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TouristAuth = require('../models/TouristAuth');

// Register a new tourist
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, nationality } = req.body;

    // Check if tourist already exists
    let tourist = await TouristAuth.findOne({ email });
    if (tourist) {
      return res.status(400).json({ message: 'Tourist already exists' });
    }

    // Create new tourist
    tourist = new TouristAuth({
      id: Math.random().toString(36).substr(2, 9),
      email,
      password,
      fullName,
      nationality
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    tourist.password = await bcrypt.hash(password, salt);

    // Save tourist
    await tourist.save();

    // Create JWT token
    const payload = {
      tourist: {
        id: tourist.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login tourist
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if tourist exists
    let tourist = await TouristAuth.findOne({ email });
    if (!tourist) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, tourist.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      tourist: {
        id: tourist.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get tourist profile
router.get('/profile', async (req, res) => {
  try {
    const tourist = await TouristAuth.findOne({ id: req.tourist.id }).select('-password');
    res.json(tourist);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; 