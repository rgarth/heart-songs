// client/src/components/game/CountdownBanner.js - Fix the issue
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
  
  console.log('🎨 CountdownBanner render:', {
    initialSeconds,
    isActive,
    timeLeft,
    isVisible,
    message
  });
  
  const resetTimer = useCallback(() => {
    console.log('🔄 CountdownBanner: resetting timer');
    setTimeLeft(initialSeconds);
    setIsVisible(false);
  }, [initialSeconds]);
  
  useEffect(() => {
    console.log('⚡ CountdownBanner useEffect:', {
      isActive,
      timeLeft,
      isVisible,
      initialSeconds
    });
    
    if (!isActive) {
      resetTimer();
      return;
    }
    
    // Set the time left to the initial seconds when countdown starts
    setTimeLeft(initialSeconds);
    setIsVisible(true);
    
    // Don't start the countdown if initialSeconds is 0 or less
    if (initialSeconds <= 0) {
      console.log('⚠️ CountdownBanner: initial seconds is 0 or less, calling onComplete');
      setIsVisible(false);
      onComplete && onComplete();
      return;
    }
    
  }, [isActive, initialSeconds, onComplete, resetTimer]);
  
  // Separate useEffect for the countdown timer
  useEffect(() => {
    if (!isActive || !isVisible || timeLeft <= 0) return;
    
    console.log('⏰ CountdownBanner: setting up timer for', timeLeft);
    
    const timer = setTimeout(() => {
      console.log('⏰ CountdownBanner: timer tick, timeLeft was', timeLeft);
      setTimeLeft(prev => {
        const newTime = prev - 1;
        console.log('⏰ CountdownBanner: setting timeLeft to', newTime);
        
        if (newTime <= 0) {
          console.log('✅ CountdownBanner: countdown complete, calling onComplete');
          setIsVisible(false);
          onComplete && onComplete();
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => {
      console.log('🧹 CountdownBanner: cleaning up timer');
      clearTimeout(timer);
    };
  }, [isActive, isVisible, timeLeft, onComplete]);
  
  if (!isActive || !isVisible) {
    console.log('🚫 CountdownBanner: not showing - isActive:', isActive, 'isVisible:', isVisible);
    return null;
  }
  
  // Determine color based on time left
  const getColorClasses = () => {
    if (timeLeft <= 3) return 'bg-red-600 border-red-500';
    if (timeLeft <= 5) return 'bg-yellow-600 border-yellow-500';
    return 'bg-orange-600 border-orange-500';
  };
  
  console.log('✨ CountdownBanner: rendering with timeLeft:', timeLeft);
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-40 ${getColorClasses()} border-b-2 transition-all duration-300`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-white">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span className="font-medium">{message}</span>
          </div>
          
          <div className="flex items-center text-white">
            <span className="text-2xl font-bold mr-4 tabular-nums">{timeLeft}s</span>
            {showCancelButton && onCancel && (
              <button
                onClick={onCancel}
                className="py-1 px-3 bg-black bg-opacity-20 text-white rounded hover:bg-opacity-30 transition-all text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownBanner;