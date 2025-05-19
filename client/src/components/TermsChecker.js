// client/src/components/TermsChecker.js - Simplified to remove persistence logic
import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A simplified TermsChecker that doesn't rely on persistence
 * Once the user is logged in, we assume they've agreed to the terms
 */
const TermsChecker = ({ children }) => {
  const location = useLocation();
  
  // If the user is already logged in or on exempt paths, show the content
  // No persistence check needed - if they're logged in, they agreed during login
  return <>{children}</>;
};

export default TermsChecker;