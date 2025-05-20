// client/src/components/StyledCheckbox.js
import React from 'react';

/**
 * Custom stylized checkbox component with rockstar theme
 * 
 * @param {boolean} checked - Whether the checkbox is checked
 * @param {function} onChange - Function to call when checkbox state changes
 * @param {boolean} disabled - Whether the checkbox is disabled
 * @param {string} id - HTML ID for the checkbox
 * @param {string} name - HTML name for the checkbox
 * @param {string} label - Label text
 */
const StyledCheckbox = ({ 
  checked, 
  onChange, 
  disabled = false, 
  id, 
  name,
  label,
  required = false,
  children 
}) => {
  return (
    <div className="mt-4">
      <div className="flex items-start">
        <div className="flex items-center h-5 relative">
          {/* Real checkbox - opacity 0 but still clickable */}
          <input
            id={id}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className="absolute w-5 h-5 opacity-0 z-10 cursor-pointer"
          />
          
          {/* Custom styled checkbox - purely visual */}
          <div 
            className={`
              w-5 h-5 rounded-sm relative flex items-center justify-center
              transition-all duration-200 border-2
              ${checked 
                ? 'bg-gradient-to-r from-electric-purple to-neon-pink border-transparent shadow-neon-pink/40 shadow-sm' 
                : 'bg-vinyl-black border-electric-purple/50 hover:border-neon-pink'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {/* Checkmark */}
            {checked && (
              <svg 
                className="w-3.5 h-3.5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3" 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            
            {/* Pulsing glow effect when checked */}
            {checked && (
              <div className="absolute inset-0 rounded-sm bg-neon-pink/20 animate-pulse"></div>
            )}
          </div>
        </div>
        
        {/* Label - also clickable for accessibility */}
        <label 
          htmlFor={id} 
          className={`
            ml-3 text-sm cursor-pointer select-none
            ${disabled ? 'opacity-50' : ''}
            ${checked ? 'text-white' : 'text-gray-300'}
          `}
        >
          {children || label}
        </label>
      </div>
      
    </div>
  );
};

export default StyledCheckbox;