// server/scripts/reset-database.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
console.log('Using connection string:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB successfully');
    
    try {
      // Get the database name from the connection string
      const dbName = MONGODB_URI.split('/').pop().split('?')[0];
      console.log(`Preparing to drop database: ${dbName}`);
      
      // Get reference to the database
      const db = mongoose.connection.db;
      
      // List all collections before dropping
      console.log('Current collections:');
      const collections = await db.listCollections().toArray();
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Drop the entire database
      console.log('Dropping the database...');
      await mongoose.connection.dropDatabase();
      console.log('Database dropped successfully');
      
      // Optional: Create indexes for future collections
      console.log('Setting up fresh database...');
      
      // Load models to ensure indexes are recreated
      require('../models/User');
      require('../models/Game');
      require('../models/Question');
      require('../models/Playlist');
      
      console.log('Database reset complete!');
    } catch (error) {
      console.error('Error resetting database:', error);
    } finally {
      // Close the connection
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
