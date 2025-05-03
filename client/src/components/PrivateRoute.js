// client/src/components/PrivateRoute.js
import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, store the current location path and redirect to login
  if (!user) {
    // Store the path in localStorage for routes that need direct access via URL
    if (location.pathname.startsWith('/join/')) {
      localStorage.setItem('redirectAfterAuth', location.pathname);
    }
    
    // Also pass the path in location state for normal redirects
    return <Navigate 
      to="/login" 
      state={{ from: location.pathname + location.search }}
      replace 
    />;
  }

  // If authenticated, render the protected component
  return children;
};

export default PrivateRoute;