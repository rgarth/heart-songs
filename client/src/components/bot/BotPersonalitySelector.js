// client/src/components/bot/BotPersonalitySelector.js
import React from 'react';

const BotPersonalitySelector = ({ 
  onPersonalitySelect, 
  selectedPersonality, 
  personalities = [] 
}) => {
  if (personalities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-electric-purple border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-silver">Loading bot personalities...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {personalities.map((personality) => (
        <div
          key={personality.id}
          onClick={() => onPersonalitySelect(personality.id)}
          className={`
            cursor-pointer rounded-lg p-4 border-2 transition-all hover:scale-[1.02]
            ${selectedPersonality === personality.id 
              ? 'border-electric-purple bg-electric-purple/20 shadow-lg shadow-electric-purple/30' 
              : 'border-electric-purple/30 hover:border-electric-purple/60 bg-stage-dark/50'
            }
          `}
        >
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">{personality.icon}</span>
            <h4 className="font-bold text-white text-lg">{personality.name}</h4>
          </div>
          <p className="text-silver text-sm leading-relaxed">
            {personality.description}
          </p>
          
          {selectedPersonality === personality.id && (
            <div className="mt-3 flex items-center text-electric-purple">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Selected</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BotPersonalitySelector;
