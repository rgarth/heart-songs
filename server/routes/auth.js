// server/routes/auth.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const querystring = require('querystring');
const dotenv = require('dotenv');

// Spotify OAuth credentials
dotenv.config('../.env');
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://127.0.0.1:3000/callback';
const FRONTEND_URI = process.env.FRONTEND_URI || 'http://127.0.0.1:3000';

// Login route - redirect to Spotify authorization
router.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email playlist-modify-private playlist-modify-public user-library-read streaming';
  
  res.redirect('https://accounts.spotify.com/authorize?' + 
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
    }));
});

// Callback route - process Spotify authorization
router.post('/callback', async (req, res) => {
  const code = req.body.code;

  try {
    // Exchange code for access token
    const tokenResponse = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get user profile information
    const userResponse = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userData = userResponse.data;
    
    // Calculate token expiry time
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);

    // Find or create user
    let user = await User.findOne({ spotifyId: userData.id });
    
    if (user) {
      // Update existing user
      user.accessToken = access_token;
      user.refreshToken = refresh_token;
      user.tokenExpiry = expiryDate;
      user.displayName = userData.display_name;
      user.email = userData.email;
      user.profileImage = userData.images.length > 0 ? userData.images[0].url : null;
    } else {
      // Create new user
      user = new User({
        spotifyId: userData.id,
        displayName: userData.display_name,
        email: userData.email,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry: expiryDate,
        profileImage: userData.images.length > 0 ? userData.images[0].url : null
      });
    }
    
    await user.save();
    
    // Return user data and tokens
    res.json({
      user: {
        id: user._id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        email: user.email,
        profileImage: user.profileImage,
        score: user.score
      },
      accessToken: access_token,
      refreshToken: refresh_token
    });
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Refresh token route
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      }
    });

    const { access_token, expires_in } = response.data;
    
    // Calculate new expiry time
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expires_in);
    
    // Update user with new access token
    const user = await User.findOne({ refreshToken });
    if (user) {
      user.accessToken = access_token;
      user.tokenExpiry = expiryDate;
      await user.save();
    }
    
    res.json({
      accessToken: access_token,
      expiryDate
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;