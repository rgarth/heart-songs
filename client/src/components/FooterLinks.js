// client/src/components/FooterLinks.js
import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer links component that includes links to Terms of Service and Privacy Policy
 * This can be added to your existing Footer component
 */
const FooterLinks = () => {
  return (
    <div className="py-3 border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-8 text-sm text-gray-400">
          <Link to="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </Link>
          
          <a 
            href="https://www.youtube.com/t/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            YouTube Terms of Service
          </a>
          
          <a 
            href="https://policies.google.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            Google Privacy Policy
          </a>
        </div>
        
        <div className="mt-2 text-center text-xs text-gray-500">
          By using Heart Songs, you agree to be bound by our Terms of Service and the YouTube Terms of Service.
        </div>
      </div>
    </div>
  );
};

export default FooterLinks;