// client/src/components/ResponsiveLayout.js
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import VinylRecord from './VinylRecord';

/**
 * A responsive layout component for Terms of Service and Privacy Policy pages
 * 
 * @param {string} title - The page title
 * @param {string} lastUpdated - Last updated date
 * @param {React.ReactNode} children - The content to display
 * @param {string} linkType - 'terms' or 'privacy' - to create a link to the other page
 */
const ResponsiveLayout = ({ title, lastUpdated, children, linkType }) => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col legal-page">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex-1">
        <div className="max-w-4xl mx-auto fade-in">
          {/* Card with themed styling */}
          <div className="bg-gradient-to-b from-stage-dark to-midnight-purple/90 rounded-lg shadow-xl overflow-hidden">
            {/* Header section with responsive layout */}
            <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-4 sm:p-6 border-b border-electric-purple/30 page-header">
              {/* Responsive header layout */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between">
                {/* Vinyl record first on mobile, left on desktop */}
                <div className="mb-4 sm:mb-0 sm:mr-6 vinyl-container">
                  <VinylRecord 
                    className="w-20 h-20 md:w-24 md:h-24" 
                    animationClass="animate-vinyl-spin"
                  />
                </div>
                
                {/* Title centered on all screens */}
                <div className="text-center flex-grow">
                  <h1 className="text-2xl sm:text-3xl font-rock bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-2 no-overflow">
                    {title}
                  </h1>
                  <p className="text-silver text-sm">Last Updated: {lastUpdated || 'May 19, 2025'}</p>
                </div>
                
                {/* Empty div for spacing on desktop */}
                <div className="hidden sm:block sm:w-20 sm:h-20 md:w-24 md:h-24"></div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 md:p-8 content-section">
              {/* Link to the other page */}
              <div className="mb-6 sm:mb-8 bg-gradient-to-r from-gold-record/10 to-yellow-400/10 rounded-lg p-4 sm:p-6 border border-gold-record/30 important-callout">
                <h2 className="text-xl font-bold text-gold-record mb-3">Important Information</h2>
                {linkType === 'terms' ? (
                  <p className="mb-0">
                    Please also review our <Link to="/privacy" className="text-gold-record font-semibold underline hover:text-yellow-300">Privacy Policy</Link> which explains how we collect, use, and share your information, including our use of YouTube API Services.
                  </p>
                ) : (
                  <p className="mb-0">
                    Please also review our <Link to="/terms" className="text-gold-record font-semibold underline hover:text-yellow-300">Terms of Service</Link> which explains the rules and conditions for using Heart Songs.
                  </p>
                )}
              </div>
              
              {/* Content */}
              <div className="prose max-w-none">
                <div className="space-y-4 sm:space-y-6 text-silver/90 leading-relaxed text-sm sm:text-base">
                  {children}
                </div>
              </div>
              
              {/* Back to Home link */}
              <div className="mt-8 text-center">
                <Link 
                  to="/"
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-electric-purple to-neon-pink text-white rounded-lg hover:shadow-lg hover:shadow-electric-purple/30 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Heart Songs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveLayout;