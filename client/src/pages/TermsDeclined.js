// client/src/pages/TermsDeclined.js
import React from 'react';
import { Link } from 'react-router-dom';

const TermsDeclined = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="container mx-auto px-4 py-12 flex-1 flex items-center justify-center">
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-2xl border border-red-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-red-900/20 to-red-600/20 p-6 border-b border-red-500/40">
              <h1 className="text-3xl font-bold text-center text-red-500">
                Terms Not Accepted
              </h1>
            </div>
            
            <div className="p-8 text-center">
              <div className="mb-6">
                <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold mb-4">You've declined the Terms of Service</h2>
              
              <p className="text-gray-300 mb-8">
                Unfortunately, you cannot use Heart Songs without accepting our Terms of Service, which include the YouTube Terms of Service.
              </p>
              
              <div className="mb-8 bg-gray-700/50 rounded-lg p-6 border border-gray-600/30">
                <p className="text-white mb-4">
                  Heart Songs uses YouTube's API services to provide music playback functionality. To use these features, you must agree to both our Terms of Service and the YouTube Terms of Service.
                </p>
                
                <p className="text-blue-400">
                  <a 
                    href="https://www.youtube.com/t/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300 transition-colors"
                  >
                    Read the YouTube Terms of Service
                  </a>
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Link
                  to="/"
                  className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Return and Accept Terms
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsDeclined;