// server/utils/usernameValidation.js

/**
 * Validate a username matches our pattern
 * @param {string} username The username to validate
 * @returns {boolean} Whether the username is valid
 */
const isValidUsername = (username) => {
    if (!username || typeof username !== 'string') {
      return false;
    }
    
    // Regex pattern for our username format: word_word_1234
    const pattern = /^[a-z]+_[a-z]+_\d{4}$/;
    
    // Test pattern and length (min 8, max 30 characters)
    return pattern.test(username) && 
           username.length >= 8 && 
           username.length <= 30;
  };
  
  module.exports = {
    isValidUsername
  };