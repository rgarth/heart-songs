// client/src/components/TermsChecker.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * A simplified TermsChecker that redirects to login if terms haven't been accepted
 * This is a lightweight guard in case users try to bypass the login page
 */
const TermsChecker = ({ children }) => {
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [checking, setChecking] = useState(true);
  
  useEffect(() => {
    // Check if the user has previously accepted the terms
    const termsAccepted = localStorage.getItem('termsAccepted') === 'true';
    setHasAcceptedTerms(termsAccepted);
    setChecking(false);
  }, []);
  
  // Show loading state while checking
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If the current route is already /login or /terms-declined, render the children
  // This prevents redirect loops
  const currentPath = window.location.pathname;
  const isExemptPath = currentPath === '/login' || 
                        currentPath === '/terms' || 
                        currentPath === '/terms-declined';
  
  // If terms haven't been accepted and we're not on an exempt path, redirect to login
  if (!hasAcceptedTerms && !isExemptPath) {
    return <Navigate to="/login" />;
  }
  
  // Terms have been accepted or we're on an exempt path, render the app
  return <>{children}</>;
};

export default TermsChecker;