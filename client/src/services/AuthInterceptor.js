// client/src/services/AuthInterceptor.js
// This function sets up a global handler for authentication errors

let authErrorHandler = null;

// Function to set the auth error handler
export const setAuthErrorHandler = (handler) => {
  authErrorHandler = handler;
};

// Function to handle auth errors
export const handleAuthError = (error) => {
  // Check if it's an authentication error
  if (error.response && error.response.status === 401) {
    console.error('Authentication error detected');
    
    // Dispatch a global event
    window.dispatchEvent(new CustomEvent('sessionExpired'));
    
    // Call the auth error handler if it exists
    if (authErrorHandler) {
      authErrorHandler();
    }
    
    // Create a custom error with auth flag
    const authError = new Error('Your session has expired. Please log in again.');
    authError.isAuthError = true;
    authError.status = 401;
    throw authError;
  }
  
  // If not an auth error, rethrow the original error
  throw error;
};
