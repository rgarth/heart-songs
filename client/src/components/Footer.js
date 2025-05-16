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
            <div className="flex items-center justify-center md:justify-start">
              <div className="w-3 h-3 bg-lime-green rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-turquoise font-medium">Live & Rocking</span>
            </div>
          </div>
          
          {/* Powered by section - Concert stage style */}
          <div className="text-center">
            <div className="text-silver text-sm mb-3 font-medium">🎤 POWERED BY</div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              
              {/* Last.fm - Vinyl record style */}
              <a 
                href="https://www.last.fm/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-r from-stage-dark to-vinyl-black rounded-full p-3 border border-electric-purple/30 hover:border-neon-pink/50 transition-all hover:shadow-neon-purple/50 hover:shadow-lg"
                title="Last.fm API - Music Discovery"
              >
                <div className="flex items-center">
                  <div className="vinyl-record w-8 h-8 mr-2 group-hover:animate-spin">
                    <div className="absolute inset-2 bg-stage-red rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">FM</span>
                    </div>
                  </div>
                  <span className="text-silver group-hover:text-white transition-colors font-medium">Last.fm</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-stage-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              {/* YouTube - Retro TV style */}
              <a 
                href="https://developers.google.com/youtube/v3" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-3 border border-electric-purple/30 hover:border-neon-pink/50 transition-all hover:shadow-neon-purple/50 hover:shadow-lg"
                title="YouTube Data API - Video Streaming"
              >
                <div className="flex items-center">
                  <div className="relative mr-2">
                    <div className="w-8 h-6 bg-stage-red rounded border-2 border-silver group-hover:border-gold-record transition-colors">
                      <div className="absolute inset-1 bg-vinyl-black rounded">
                        <div className="absolute top-1 left-1 right-1 h-1 bg-gradient-to-r from-electric-purple to-neon-pink rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute bottom-1 left-2 right-2 h-1 bg-turquoise rounded-full opacity-30 group-hover:opacity-80 transition-opacity"></div>
                      </div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-lime-green rounded-full animate-pulse"></div>
                  </div>
                  <span className="text-silver group-hover:text-white transition-colors font-medium">YouTube</span>
                </div>
              </a>
            </div>
            
            {/* Added musical note decorations */}
            <div className="mt-4 flex justify-center items-center gap-2 text-electric-purple/30">
              <span className="animate-bounce">♪</span>
              <span className="animate-bounce" style={{animationDelay: '0.2s'}}>♫</span>
              <span className="animate-bounce" style={{animationDelay: '0.4s'}}>♪</span>
              <span className="animate-bounce" style={{animationDelay: '0.6s'}}>♫</span>
              <span className="animate-bounce" style={{animationDelay: '0.8s'}}>♪</span>
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