const express = require('express');
const router = express.Router();
const GuideAuth = require('../models/GuideAuth');
const Guide = require('../models/Guide');
const GuideRequest = require('../models/GuideRequest');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Register a new guide
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    // Check if guide already exists
    const existingGuide = await GuideAuth.findOne({ email });
    if (existingGuide) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Create new guide auth
    const guideAuth = new GuideAuth({
      id: `guide_auth_${Date.now()}`,
      email,
      password,
      fullName,
      hasProfile: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await guideAuth.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: guideAuth.id, email: guideAuth.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Return guide data without password
    const guideData = {
      id: guideAuth.id,
      email: guideAuth.email,
      fullName: guideAuth.fullName,
      hasProfile: guideAuth.hasProfile,
      createdAt: guideAuth.createdAt,
      updatedAt: guideAuth.updatedAt,
      token
    };
    
    res.status(201).json(guideData);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login a guide
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find guide by email
    const guideAuth = await GuideAuth.findOne({ email });
    if (!guideAuth) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isMatch = await guideAuth.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if guide has a profile
    const hasProfile = await Guide.exists({ id: guideAuth.id });
    guideAuth.hasProfile = !!hasProfile;
    await guideAuth.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: guideAuth.id, email: guideAuth.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Return guide data without password
    const guideData = {
      id: guideAuth.id,
      email: guideAuth.email,
      fullName: guideAuth.fullName,
      hasProfile: guideAuth.hasProfile,
      createdAt: guideAuth.createdAt,
      updatedAt: guideAuth.updatedAt,
      token
    };
    
    res.json(guideData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get guide requests - Protected route
router.get('/:guideId/requests', auth, async (req, res) => {
  try {
    const { guideId } = req.params;
    
    // Verify that the authenticated user is requesting their own data
    if (req.user.id !== guideId) {
      return res.status(403).json({ message: 'Not authorized to access these requests' });
    }
    
    // Check if guide exists
    const guide = await Guide.findOne({ id: guideId });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    
    // Get guide requests
    const requests = await GuideRequest.find({ guideId }).sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error getting guide requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update request status - Protected route
router.patch('/:guideId/requests/:requestId', auth, async (req, res) => {
  try {
    const { guideId, requestId } = req.params;
    const { status } = req.body;
    
    // Verify that the authenticated user is updating their own request
    if (req.user.id !== guideId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find and update request
    const request = await GuideRequest.findOneAndUpdate(
      { id: requestId, guideId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 