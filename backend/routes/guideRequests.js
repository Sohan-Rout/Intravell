const express = require('express');
const router = express.Router();
const GuideRequest = require('../models/GuideRequest');
const Guide = require('../models/Guide');
const auth = require('../middleware/auth');

// Create a new guide request - Protected route
router.post('/', auth, async (req, res) => {
  try {
    const { 
      guideId, 
      touristId, 
      touristName, 
      startDate, 
      endDate, 
      numberOfPeople, 
      notes 
    } = req.body;
    
    // Check if guide exists
    const guide = await Guide.findOne({ id: guideId });
    if (!guide) {
      return res.status(404).json({ message: 'Guide not found' });
    }
    
    // Create new request
    const request = new GuideRequest({
      id: `request_${Date.now()}`,
      guideId,
      touristId,
      touristName,
      startDate,
      endDate,
      numberOfPeople,
      notes,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await request.save();
    
    // Increment guide's request count
    guide.requestCount = (guide.requestCount || 0) + 1;
    await guide.save();
    
    res.status(201).json(request);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all requests for a guide - Protected route
router.get('/guide/:guideId', auth, async (req, res) => {
  try {
    const { guideId } = req.params;
    const { status } = req.query;
    
    // Verify that the authenticated user is requesting their own data
    if (req.user.id !== guideId) {
      return res.status(403).json({ message: 'Not authorized to access these requests' });
    }
    
    // Build query
    const query = { guideId };
    if (status) {
      query.status = status;
    }
    
    // Get requests
    const requests = await GuideRequest.find(query).sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error getting guide requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all requests from a tourist - Protected route
router.get('/tourist/:touristId', auth, async (req, res) => {
  try {
    const { touristId } = req.params;
    const { status } = req.query;
    
    // Verify that the authenticated user is requesting their own data
    if (req.user.id !== touristId) {
      return res.status(403).json({ message: 'Not authorized to access these requests' });
    }
    
    // Build query
    const query = { touristId };
    if (status) {
      query.status = status;
    }
    
    // Get requests
    const requests = await GuideRequest.find(query).sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    console.error('Error getting tourist requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific request - Protected route
router.get('/:id', auth, async (req, res) => {
  try {
    const request = await GuideRequest.findOne({ id: req.params.id });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Verify that the authenticated user is requesting their own data
    if (req.user.id !== request.guideId && req.user.id !== request.touristId) {
      return res.status(403).json({ message: 'Not authorized to access this request' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Error getting request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update request status - Protected route
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Find request
    const request = await GuideRequest.findOne({ id });
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Verify that the authenticated user is updating their own request
    if (req.user.id !== request.guideId) {
      return res.status(403).json({ message: 'Not authorized to update this request' });
    }
    
    // Validate status
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Update request
    request.status = status;
    request.updatedAt = new Date();
    await request.save();
    
    res.json(request);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 