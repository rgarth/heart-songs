// client/src/components/game/CountdownTimer.js
import React, { useState, useEffect, useCallback } from 'react';

const CountdownTimer = ({ 
  initialSeconds = 10, 
  onComplete, 
  onCancel, 
  isActive = false,
  message = "Ending selection in..."
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  const resetTimer = useCallback(() => {
    setTimeLeft(initialSeconds);
    setIsCountingDown(false);
  }, [initialSeconds]);
  
  useEffect(() => {
    if (!isActive) {
      resetTimer();
      return;
    }
    
    if (!isCountingDown) {
      setIsCountingDown(true);
    }
    
    if (timeLeft <= 0) {
      onComplete();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, isActive, isCountingDown, onComplete, resetTimer]);
  
  if (!isActive || !isCountingDown) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center">
        <h3 className="text-xl font-bold mb-4 text-red-400">Attention!</h3>
        <p className="mb-6">{message}</p>
        
        <div className="mb-6">
          <div className={`text-6xl font-bold ${
            timeLeft <= 3 ? 'text-red-500' : 'text-yellow-400'
          }`}>
            {timeLeft}
          </div>
          <div className="mt-2 text-gray-400">
            second{timeLeft !== 1 ? 's' : ''}
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onCancel}
            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;