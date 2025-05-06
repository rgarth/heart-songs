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
    
    if (!authHeader) {
      console.error('No Authorization header found');
      return res.status(401).json({ error: 'Authentication required - No Authorization header' });
    }
    
    // Check if header starts with Bearer
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Authorization header does not start with Bearer');
      return res.status(401).json({ error: 'Authentication required - Invalid Authorization format' });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.error('No token found in Authorization header');
      return res.status(401).json({ error: 'Authentication required - No token found' });
    }
    
    // Find the user by session token
    const user = await User.findOne({ anonId: token });
    
    if (!user) {
      console.error('No user found with the provided token:', token.substring(0, 10) + '...');
      return res.status(401).json({ error: 'Invalid or expired session - User not found' });
    }
    
    // Check if token is expired
    const now = new Date();
    if (user.tokenExpiry && user.tokenExpiry < now) {
      console.error('Token expired for user:', user.displayName);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Attach user object to request for use in route handlers
    req.user = user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed - Server error' });
  }
};

module.exports = {
  authenticateUser
};