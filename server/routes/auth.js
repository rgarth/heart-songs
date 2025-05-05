// server/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const { isValidUsername } = require('../utils/usernameValidation');

// Register anonymous user
router.post('/register-anonymous', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || !isValidUsername(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }
    
    // Check if username is already taken
    const existingUser = await User.findOne({ displayName: username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    
    // Generate session token (use as ID as well for anonymous users)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    // Calculate token expiry time (24 hours)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);
    
    // Create new anonymous user
    const user = new User({
      anonId: sessionToken,
      displayName: username,
      isAnonymous: true,
      score: 0,
      tokenExpiry: expiryDate
    });
    
    await user.save();
    
    // Return user data and session token
    res.json({
      user: {
        id: user._id,
        displayName: user.displayName,
        score: user.score,
        isAnonymous: true
      },
      sessionToken: sessionToken
    });
  } catch (error) {
    console.error('Error registering anonymous user:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Check username availability
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || !isValidUsername(username)) {
      return res.json({ available: false });
    }
    
    // Check if username exists
    const existingUser = await User.findOne({ displayName: username });
    
    res.json({
      available: !existingUser
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

// Validate session token
router.post('/validate-session', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (!sessionToken) {
      return res.json({ valid: false });
    }
    
    // Find user by session token
    const user = await User.findOne({ anonId: sessionToken });
    
    if (!user) {
      return res.json({ valid: false });
    }
    
    // Check if token is expired
    const now = new Date();
    if (user.tokenExpiry < now) {
      return res.json({ valid: false });
    }
    
    // Return valid status and user data
    res.json({
      valid: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        score: user.score,
        isAnonymous: true
      }
    });
  } catch (error) {
    console.error('Error validating session:', error);
    res.status(500).json({ error: 'Failed to validate session' });
  }
});

module.exports = router;