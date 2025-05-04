// server/middleware/auth.js
const User = require('../models/User');

/**
 * Middleware to authenticate requests using the session token
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Next middleware function
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Find the user by session token
    const user = await User.findOne({ anonId: token });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Check if token is expired
    const now = new Date();
    if (user.tokenExpiry && user.tokenExpiry < now) {
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Attach user object to request for use in route handlers
    req.user = user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateUser
};