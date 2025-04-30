// client/src/services/AuthService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5050/api';

export const getLoginUrl = () => {
  return `${API_URL}/auth/login`;
};

export const handleCallback = async (code) => {
  try {
    const response = await axios.post(`${API_URL}/auth/callback`, { code });
    return response.data;
  } catch (error) {
    console.error('Error in handleCallback:', error);
    throw error;
  }
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};
