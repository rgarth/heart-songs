// client/src/components/Footer.js
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 py-4 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} Heart Songs - All rights reserved
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-gray-400 text-sm">Powered by:</div>
            
            {/* Last.fm Logo */}
            <a 
              href="https://www.last.fm/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="Last.fm API"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-gray-300"
              >
                <path d="M19.7834 5.64594C17.5646 3.47859 13.4612 3.38539 11.3486 5.72475L11.1986 5.89085C10.5734 6.56887 10.6418 7.5121 11.346 8.10678C12.0525 8.70391 13.1147 8.631 13.728 7.95946C14.4326 7.19576 16.8009 7.44135 18.0486 8.71488C19.3162 10.0008 19.5265 12.2127 18.7684 12.854L13.3546 18.4099C12.0362 19.7553 10.0437 19.8239 8.78598 18.5527C7.53323 17.2866 7.67223 15.2877 9.0078 13.9673L9.83236 13.1299C10.3781 12.5765 10.3815 11.6985 9.84036 11.141C9.29659 10.5809 8.41035 10.5783 7.86201 11.1349L7.0301 11.9798C4.5553 14.4837 4.54983 18.5762 7.01889 21.0824C9.5029 23.604 13.5993 23.5959 16.0741 21.0919L21.5413 15.4825C23.608 13.3726 22.0174 7.82694 19.7834 5.64594Z" />
                <path d="M13.9949 10.3493L10.3481 14.0747" />
              </svg>
            </a>
            
            {/* YouTube Logo */}
            <a 
              href="https://developers.google.com/youtube/v3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-60 hover:opacity-100 transition-opacity"
              title="YouTube Data API"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="28" 
                height="28" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.75" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-gray-300"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;