
// client/src/components/bot/AddBotButton.js - Simplified to only add Music Scholar
import React, { useState } from 'react';
import botService from '../../services/botService';

const AddBotButton = ({ onAddBot, gameId, maxPlayers = 6, currentPlayerCount = 0 }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  const handleAddBot = async () => {
    try {
      setIsAdding(true);
      setError(null);

      // Always use 'analytical' personality (Music Scholar)
      const result = await botService.addBotToGame(gameId, 'analytical');
      
      if (onAddBot) {
        onAddBot(result);
      }
      
    } catch (error) {
      console.error('Failed to add bot:', error);
      setError(error.message || 'Failed to add AI player');
    } finally {
      setIsAdding(false);
    }
  };

  // Check if we can add more bots
  const canAddBot = currentPlayerCount < maxPlayers;

  if (!canAddBot) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center bg-gray-700/50 rounded-lg px-4 py-2 border border-gray-600/50">
          <span className="text-gray-400 text-sm">Game is full ({maxPlayers} players)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <button
        onClick={handleAddBot}
        disabled={isAdding}
        className={`
          inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all
          ${isAdding 
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-electric-purple to-neon-pink hover:shadow-neon-purple/50 hover:shadow-lg text-white'
          }
        `}
      >
        {isAdding ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            Adding AI Scholar...
          </>
        ) : (
          <>
            <span className="mr-2">🎓</span>
            Add AI Music Scholar
          </>
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-stage-red text-sm">
          {error}
        </div>
      )}
      
      <p className="text-xs text-silver mt-2">
        Adds an AI player that analyzes music based on theory and lyrics
      </p>
    </div>
  );
};

export default AddBotButton;
