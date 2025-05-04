// client/src/utils/usernameGenerator.js

// First part of username - music-related words
const firstWords = [
    'rock', 'jazz', 'pop', 'indie', 'folk', 'blues', 'metal', 
    'disco', 'techno', 'funk', 'soul', 'rap', 'electro', 'country',
    'synth', 'beat', 'rhythm', 'melody', 'tempo', 'bass', 'guitar',
    'piano', 'drum', 'vocal', 'soprano', 'alto', 'tenor'
  ];
  
  // Second part of username - descriptive words
  const secondWords = [
    'legend', 'hero', 'star', 'master', 'guru', 'fan', 'lover',
    'player', 'artist', 'creator', 'maker', 'genius', 'prodigy',
    'enthusiast', 'aficionado', 'devotee', 'virtuoso', 'maestro',
    'rocker', 'singer', 'dancer', 'listener', 'expert', 'ninja',
    'wizard', 'champion', 'chief', 'captain', 'commander'
  ];
  
  /**
   * Generate a random username in the format: musicword_musicword_NNNN
   * @returns {string} Random username
   */
  export const generateUsername = () => {
    // Get random words from each array
    const first = firstWords[Math.floor(Math.random() * firstWords.length)];
    const second = secondWords[Math.floor(Math.random() * secondWords.length)];
    
    // Generate random 4-digit number
    const number = Math.floor(1000 + Math.random() * 9000);
    
    // Combine with underscores
    return `${first}_${second}_${number}`;
  };
  
  /**
   * Validate a username matches our pattern
   * @param {string} username The username to validate
   * @returns {boolean} Whether the username is valid
   */
  export const isValidUsername = (username) => {
    // Regex pattern for our username format
    const pattern = /^[a-z]+_[a-z]+_\d{4}$/;
    
    // Test pattern and length (min 8, max 30 characters)
    return pattern.test(username) && 
           username.length >= 8 && 
           username.length <= 30;
  };