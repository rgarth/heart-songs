// client/src/components/Footer.js - Rockstar Design Edition
import React from 'react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-t from-deep-space via-vinyl-black to-stage-dark border-t border-electric-purple/30 crowd-silhouette">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          {/* Copyright section with rock styling */}
          <div className="text-center md:text-left mb-6 md:mb-0">
            <div className="text-silver text-sm mb-2">
              © {new Date().getFullYear()} 
              <span className="text-gold-record font-semibold ml-1">Heart Songs</span>
              <span className="text-electric-purple ml-1">•</span>
              <span className="ml-1">All rights reserved</span>
            </div>
          </div>
          
        </div>
        
        {/* Stage lights decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-purple via-neon-pink via-turquoise via-lime-green to-gold-record opacity-50"></div>
        
        {/* Concert spotlight effects */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-electric-purple/5 rounded-full -translate-y-16 blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-neon-pink/5 rounded-full -translate-y-16 blur-3xl"></div>
      </div>
    </footer>
  );
};

export default Footer;