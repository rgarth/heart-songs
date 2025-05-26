// client/src/components/ActionButton.js
import React from 'react';
import VinylRecord from './VinylRecord';

const ActionButton = ({ 
  onClick, 
  children, 
  className = "btn-electric", 
  loadingText = "Loading...",
  isLoading = false,
  disabled = false,
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${className} ${(isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <VinylRecord className="w-5 h-5 animate-spin mr-2" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default ActionButton;