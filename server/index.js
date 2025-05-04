// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const spotifyRoutes = require('./routes/spotify');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Log request headers for debugging auth issues
  if (req.url.includes('/api/game/') || req.url.includes('/api/auth/')) {
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  }
  
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`${new Date().toISOString()} - Response ${res.statusCode} for ${req.method} ${req.url}`);
    if (res.statusCode >= 400) {
      console.log('Error response body:', body);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/spotify', spotifyRoutes);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});