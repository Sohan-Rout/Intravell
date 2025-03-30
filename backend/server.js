require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const guideRoutes = require('./routes/guides');
const WebSocket = require('ws');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

const wss = new WebSocket.Server({ port: 8080 });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/guides', guideRoutes);

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

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', async (message) => {
    try {
      if (message instanceof Buffer) {
        // Handle audio chunk (would need speech-to-text processing)
        console.log('Received audio chunk');
      } else {
        const data = JSON.parse(message);
        
        if (data.type === 'text') {
          // Get response from ChatGPT
          const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are a helpful travel assistant for India. Keep responses brief and conversational."
              },
              {
                role: "user",
                content: data.content
              }
            ]
          });
          
          const agentMessage = response.choices[0].message.content;
          
          // Send back to client
          ws.send(JSON.stringify({
            type: 'agent_response',
            content: agentMessage
          }));
        }
      }
    } catch (error) {
      console.error('Message processing error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:8080');

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 