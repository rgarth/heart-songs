// client/src/services/AuthService.js
import axios from 'axios';
import { generateUsername } from '../utils/usernameGenerator';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

// Register anonymously with the game server
export const registerAnonymous = async (username = null) => {
  try {
    // If no username is provided, generate one
    const playerName = username || generateUsername();
    
    const response = await axios.post(`${API_URL}/auth/register-anonymous`, { 
      username: playerName 
    });
    
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
    const response = await axios.post(`${API_URL}/auth/validate-session`, { 
      sessionToken 
    });
    
    return response.data;
  } catch (error) {
    console.error('Error validating session:', error);
    throw error;
  }
};