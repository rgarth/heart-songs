// server/scripts/test-user-creation.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Generate test data
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const username = `test_user_${Math.floor(1000 + Math.random() * 9000)}`;
      
      console.log('Attempting to create test user with:');
      console.log('- Token:', sessionToken);
      console.log('- Username:', username);
      
      // Calculate expiry dates
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create test user
      const user = new User({
        anonId: sessionToken,
        displayName: username,
        isAnonymous: true,
        score: 0,
        tokenExpiry: tokenExpiry,
        expiresAt: expiresAt
      });
      
      // Save to database
      await user.save();
      console.log('Successfully created test user in database:');
      console.log(user);
      
      // Try to find the user by anonId
      console.log('Attempting to retrieve user by anonId...');
      const foundUser = await User.findOne({ anonId: sessionToken });
      
      if (foundUser) {
        console.log('Successfully retrieved user by anonId:');
        console.log(foundUser);
      } else {
        console.error('Failed to retrieve user by anonId!');
      }
      
    } catch (error) {
      console.error('Error in test script:', error);
    } finally {
      // Close the database connection
      mongoose.connection.close();
      console.log('Database connection closed');
    }
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
  });