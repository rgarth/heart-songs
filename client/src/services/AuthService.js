// client/src/services/AuthService.js
import axios from 'axios';
import { generateUsername } from '../utils/usernameGenerator';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

// Register anonymously with the game server
export const registerAnonymous = async (username = null) => {
  try {
    // If no username is provided, generate one
    const playerName = username || generateUsername();
    
    console.log('Registering anonymous user with username:', playerName);
    
    const response = await axios.post(`${API_URL}/auth/register-anonymous`, { 
      username: playerName 
    });
    
    console.log('Registration response:', response.data);
    
    // Validate response data
    if (!response.data || !response.data.sessionToken) {
      console.error('Invalid response data - missing sessionToken:', response.data);
      throw new Error('Server returned invalid data');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in anonymous registration:', error);
    throw error;
  }
};

// Check if username is available
export const checkUsernameAvailability = async (username) => {
  try {
    const response = await axios.post(`${API_URL}/auth/check-username`, { 
      username 
    });
    
    return response.data.available;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false; // Assume username is taken if there's an error
  }
};

// Validate user session
export const validateSession = async (sessionToken) => {
  try {
    if (!sessionToken) {
      console.error('No sessionToken provided to validateSession');
      return { valid: false };
    }
    
    console.log('Validating session with token:', sessionToken);
    
    const response = await axios.post(`${API_URL}/auth/validate-session`, { 
      sessionToken 
    });
    
    console.log('Validation response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error validating session:', error);
    return { valid: false };
  }
};