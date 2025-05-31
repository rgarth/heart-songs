// server/index.js - Updated with game cleanup service
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const musicRoutes = require('./routes/music');
const cacheRoutes = require('./routes/cache');
const botRoutes = require('./routes/bot');

// NEW: Import game cleanup service
const gameCleanupService = require('./services/gameCleanupService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // NEW: Start game cleanup service after DB connection
    gameCleanupService.start();
  })
  .catch(err => console.error('Failed to connect to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/bot', botRoutes);

// NEW: Admin route for cleanup stats and manual triggers
app.get('/api/admin/cleanup/stats', async (req, res) => {
  try {
    const stats = await gameCleanupService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    res.status(500).json({ error: 'Failed to get cleanup stats' });
  }
});

app.post('/api/admin/cleanup/manual', async (req, res) => {
  try {
    await gameCleanupService.manualCleanup();
    res.json({ message: 'Manual cleanup completed' });
  } catch (error) {
    console.error('Error running manual cleanup:', error);
    res.status(500).json({ error: 'Failed to run manual cleanup' });
  }
});

// Enhanced health check with cleanup service status
app.get('/health', async (req, res) => {
  try {
    // Basic health info
    const health = { 
      status: 'ok', 
      version: '1.0.0',
      cacheEnabled: true,
      timestamp: new Date().toISOString()
    };

    // Add cleanup service status
    try {
      const cleanupStats = await gameCleanupService.getStats();
      health.gameCleanup = {
        serviceRunning: cleanupStats.serviceRunning,
        activeGames: cleanupStats.totalActiveGames,
        staleGames: cleanupStats.staleGamesCount
      };
    } catch (cleanupError) {
      health.gameCleanup = { error: 'Could not get cleanup stats' };
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    error: 'Server error', 
    message: err.message || 'An unexpected error occurred'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Stop cleanup service
  gameCleanupService.stop();
  
  // Close MongoDB connection
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Stop cleanup service
  gameCleanupService.stop();
  
  // Close MongoDB connection
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('YouTube cache system enabled');
  console.log('Bot service integration enabled');
  console.log('Game cleanup service will start after DB connection');
});