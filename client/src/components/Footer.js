// client/src/components/Footer.js - Updated with Terms Links
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          {/* Copyright section */}
          <div className="text-center md:text-left mb-6 md:mb-0">
            <div className="text-gray-400 text-sm mb-2">
              © {new Date().getFullYear()} 
              <span className="text-yellow-400 font-semibold ml-1">Heart Songs</span>
              <span className="text-purple-400 ml-1">•</span>
              <span className="ml-1">All rights reserved</span>
            </div>
          </div>
          
          {/* Important terms notice */}
          <div className="text-center md:text-right text-sm text-gray-400 mb-4 md:mb-0">
            By using Heart Songs, you agree to be bound by our{' '}
            <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline">
              Terms of Service
            </Link>{' '}
            and the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              YouTube Terms of Service
            </a>
          </div>
        </div>
        
        {/* Stage lighting decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 via-blue-500 via-green-500 to-yellow-500 opacity-50"></div>
      </div>
    </footer>
  );
};

export default Footer;