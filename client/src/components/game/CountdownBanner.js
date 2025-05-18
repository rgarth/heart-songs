// client/src/components/game/CountdownBanner.js - Refined Rockstar Design
import React, { useState, useEffect, useCallback } from 'react';

const CountdownBanner = ({ 
  initialSeconds = 10, 
  onComplete, 
  onCancel, 
  isActive = false,
  message = "Ending selection in...",
  showCancelButton = false
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isVisible, setIsVisible] = useState(false);
  
  const resetTimer = useCallback(() => {
    setTimeLeft(initialSeconds);
    setIsVisible(false);
  }, [initialSeconds]);
  
  useEffect(() => {
    if (!isActive) {
      resetTimer();
      return;
    }
    
    // Set the time left to the initial seconds when countdown starts
    setTimeLeft(initialSeconds);
    setIsVisible(true);
    
    // Don't start the countdown if initialSeconds is 0 or less
    if (initialSeconds <= 0) {
      setIsVisible(false);
      onComplete && onComplete();
      return;
    }
    
  }, [isActive, initialSeconds, onComplete, resetTimer]);
  
  // Separate useEffect for the countdown timer
  useEffect(() => {
    if (!isActive || !isVisible || timeLeft <= 0) return;
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsVisible(false);
          onComplete && onComplete();
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isActive, isVisible, timeLeft, onComplete]);
  
  if (!isActive || !isVisible) {
    return null;
  }
  
  // Determine color based on time left - with enhanced gold gradient and better contrast
  const getColorClasses = () => {
    if (timeLeft <= 3) return 'bg-gradient-to-r from-electric-purple to-neon-pink border-electric-purple shadow-neon-pink/30';
    if (timeLeft <= 5) return 'bg-gradient-to-r from-amber-600 via-gold-record to-yellow-500 border-amber-600 shadow-amber-600/30';
    return 'bg-gradient-to-r from-turquoise to-lime-green border-turquoise shadow-turquoise/30';
  };
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-40 ${getColorClasses()} shadow-md border-b-2 transition-colors duration-300 ease-in-out`}>
      <div className="container mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          {/* Message with clearer text */}
          <div className="flex items-center">
            <span className="font-concert text-white font-medium text-lg tracking-wide">
              {message}
            </span>
          </div>
          
          <div className="flex items-center">
            {/* Countdown with better readability */}
            <div className="flex items-center bg-vinyl-black/40 rounded-lg px-4 py-1 border border-white/30 mr-3">
              <span className="text-3xl font-rock font-bold tabular-nums text-white">
                {timeLeft}
              </span>
              <span className="text-sm font-medium text-white ml-1">sec</span>
            </div>
            
            {/* Cancel button with refined style */}
            {showCancelButton && onCancel && (
              <button
                onClick={onCancel}
                className="py-1 px-4 bg-vinyl-black/40 text-white rounded-lg border border-white/30 hover:bg-white/20 transition-colors"
              >
                CANCEL
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Subtle light effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/20"></div>
    </div>
  );
};

export default CountdownBanner;