// client/src/components/Footer.js - Fixed to prevent bottom border from scrolling
import React from 'react';
import { Link } from 'react-router-dom';
import LastFmIcon from './LastFmIcon';
import YouTubeIcon from './YouTubeIcon';

const Footer = () => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 relative">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          {/* Copyright section */}
          <div className="text-center md:text-left mb-6 md:mb-0">
            <div className="text-gray-400 text-sm mb-2">
              © {new Date().getFullYear()} 
              <span className="text-yellow-400 font-semibold ml-1">Heartsongs</span>
              <span className="text-purple-400 ml-1">•</span>
              <span className="ml-1">All rights reserved</span>
            </div>
          </div>
          
          {/* Important links notice */}
          <div className="text-center md:text-right text-sm text-gray-400 mb-4 md:mb-0">
            By using Heart Songs, you agree to our{' '}
            <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline">
              Terms of Service
            </Link>{', '}
            <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
              Privacy Policy
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
        {/* Attribution section with both icons */}
        <div className="flex items-center justify-center mt-4 mb-4">
          <span className="text-gray-400 text-sm mr-3">Powered by</span>
          <div className="flex items-center space-x-4">
            {/* Last.fm attribution */}
            <a 
              href="https://www.last.fm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity flex items-center"
              title="Last.fm API"
            >
              <LastFmIcon className="h-5 text-gray-400" />
            </a>
            
            {/* YouTube attribution */}
            <a 
              href="https://developers.google.com/youtube/terms/api-services-terms-of-service" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity flex items-center"
              title="YouTube API"
            >
              <YouTubeIcon className="h-5 text-red-500" />
            </a>
          </div>
        </div>
        
        {/* Stage lighting decoration - FIXED to stay at the bottom */}
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 via-blue-500 via-green-500 to-yellow-500 opacity-50 z-10"></div>
      </div>
    </footer>
  );
};

export default Footer;