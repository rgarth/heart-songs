// client/src/components/ActionError.js
import React from 'react';

const ActionError = ({ error, onDismiss, className = "" }) => {
  if (!error) return null;

  return (
    <div className={`bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center text-stage-red">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-stage-red hover:text-red-400 ml-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionError;