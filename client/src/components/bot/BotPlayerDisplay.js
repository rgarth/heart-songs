// client/src/components/bot/BotPlayerDisplay.js
import React, { useState } from 'react';
import botService from '../../services/botService';
import VinylRecord from '../VinylRecord';

const BotPlayerDisplay = ({ player, onRemoveBot, canRemove = false, gameId }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState(null);
  
  const botInfo = botService.getBotInfo(player.user.displayName);

  const handleRemove = async () => {
    if (!canRemove || isRemoving) return;
    
    try {
      setIsRemoving(true);
      setRemoveError(null);
      
      await botService.removeBotFromGame(gameId, player.user._id);
      
      // Call the parent callback to update the UI
      if (onRemoveBot) {
        onRemoveBot(player.user._id);
      }
    } catch (error) {
      console.error('Failed to remove bot:', error);
      setRemoveError('Failed to remove bot');
    } finally {
      setIsRemoving(false);
    }
  };

  if (!botInfo) {
    return null; // Not a bot, shouldn't render
  }

  const getBotTypeEmoji = () => {
    return botService.getBotEmoji(botInfo.type);
  };

  return (
    <div className="bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-4 border border-electric-purple/30 relative">
      
      {/* Bot Badge */}
      <div className="absolute top-2 right-2">
        <span className="bg-gradient-to-r from-electric-purple to-neon-pink text-white text-xs px-2 py-1 rounded-full font-medium">
          🤖 AI
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Bot Avatar */}
          <div className="relative mr-4">
            <div className="w-12 h-12 bg-gradient-to-r from-electric-purple to-neon-pink rounded-full flex items-center justify-center">
              <span className="text-2xl">{getBotTypeEmoji()}</span>
            </div>
            
            {/* Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-turquoise rounded-full flex items-center justify-center">
              <div className={`w-3 h-3 rounded-full ${
                player.isReady ? 'bg-lime-green animate-pulse' : 'bg-stage-red'
              }`}></div>
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <p className="font-semibold text-white font-concert text-lg">
                {player.user.displayName}
              </p>
            </div>
            <p className="text-turquoise text-sm capitalize">
              {botInfo.type.replace(/[_-]/g, ' ')} Bot • AI Player
            </p>
            {player.score > 0 && (
              <p className="text-gold-record text-sm font-medium">
                {player.score} points
              </p>
            )}
          </div>
        </div>

        {/* Status & Remove Button */}
        <div className="flex items-center gap-3">
          {/* Ready Status */}
          {player.isReady ? (
            <div className="flex items-center text-lime-green font-medium animate-pulse">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>READY TO ROCK</span>
            </div>
          ) : (
            <div className="flex items-center text-stage-red">
              <div className="mr-2">
                <VinylRecord 
                  className="w-5 h-5" 
                  animationClass="animate-spin"
                />
              </div>
              <span>TUNING UP</span>
            </div>
          )}

          {/* Remove Button */}
          {canRemove && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-stage-red hover:text-red-400 transition-colors disabled:opacity-50 p-1 rounded hover:bg-stage-red/10"
              title="Remove bot from game"
            >
              {isRemoving ? (
                <div className="w-5 h-5 border-2 border-stage-red border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Remove Error */}
      {removeError && (
        <div className="mt-3 text-stage-red text-sm">
          {removeError}
        </div>
      )}
    </div>
  );
};

export default BotPlayerDisplay;