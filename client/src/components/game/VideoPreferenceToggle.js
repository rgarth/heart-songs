// client/src/components/game/VideoPreferenceToggle.js
import React from 'react';

const VideoPreferenceToggle = ({ 
  preferVideo, 
  onToggle, 
  disabled = false, 
  showLabel = true 
}) => {
  return (
    <div className="inline-flex items-center">
      {showLabel && (
        <span className="text-sm text-gray-400 mr-3">
          Media preference:
        </span>
      )}
      
      <div className="relative inline-flex">
        {/* Background track */}
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`
            px-1 py-1 flex items-center h-8 bg-gray-700 rounded-full
            transition-colors duration-200 ease-in-out relative w-28
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
          `}
        >
          {/* Sliding toggle */}
          <div
            className={`
              absolute inset-y-1 left-1 w-12 h-6 bg-white rounded-full shadow
              transform transition-transform duration-200 ease-in-out
              ${preferVideo ? 'translate-x-14' : 'translate-x-0'}
            `}
          />
          
          {/* Audio option */}
          <div className={`
            relative z-10 flex-1 text-center text-xs font-medium transition-colors
            ${!preferVideo ? 'text-gray-800' : 'text-gray-400'}
          `}>
            Audio
          </div>
          
          {/* Video option */}
          <div className={`
            relative z-10 flex-1 text-center text-xs font-medium transition-colors
            ${preferVideo ? 'text-gray-800' : 'text-gray-400'}
          `}>
            Video
          </div>
        </button>
      </div>
      
      {/* Tooltip */}
      <div className="ml-2">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 text-gray-400"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          title={preferVideo 
            ? "Showing music videos - may use more data" 
            : "Showing audio versions - better for data usage"}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
    </div>
  );
};

export default VideoPreferenceToggle;