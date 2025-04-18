require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const guideRoutes = require('./routes/guides');
const bookingRoutes = require('./routes/bookings');
const guideAuthRoutes = require('./routes/guideAuth');
const guideRequestRoutes = require('./routes/guideRequests');
const { OpenAI } = require('openai');

const app = express();
const PORT = 3300;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middlewarenpm 
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/guides', guideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/guide-auth', guideAuthRoutes);
app.use('/api/guide-requests', guideRequestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: err.message 
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));




// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 