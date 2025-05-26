// client/src/components/ActionButton.js - Improved with debouncing
import React, { useState, useRef } from 'react';
import VinylRecord from './VinylRecord';

const ActionButton = ({ 
  onClick, 
  children, 
  className = "btn-electric", 
  loadingText = "Loading...",
  isLoading = false,
  disabled = false,
  debounceMs = 500, // Prevent rapid clicks
  ...props 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const lastClickTime = useRef(0);

  const handleClick = async (e) => {
    const now = Date.now();
    
    // Debounce: Prevent clicks that are too close together
    if (now - lastClickTime.current < debounceMs) {
      console.warn('Click ignored due to debouncing');
      return;
    }
    
    lastClickTime.current = now;
    
    if (isLoading || disabled || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      await onClick(e);
    } catch (error) {
      console.error('Action button click error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = isLoading || disabled || isProcessing;

  return (
    <button
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={`${className} ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {(isLoading || isProcessing) ? (
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