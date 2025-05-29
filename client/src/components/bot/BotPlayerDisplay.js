import React, { useState } from 'react';
import VinylRecord from '../VinylRecord';
import { botService } from './index';

const BotPlayerDisplay = ({ player, onRemoveBot, canRemove, gameId }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  
  const botInfo = botService.getBotInfo(player.user.displayName);
  
  const handleRemove = async () => {
    if (!canRemove || isRemoving) return;
    
    try {
      setIsRemoving(true);
      await onRemoveBot(player.user._id);
    } catch (error) {
      console.error('Failed to remove bot:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-4 border transition-all ${
      player.isReady
        ? 'border-lime-green shadow-lg shadow-lime-green/20'
        : 'border-electric-purple/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative mr-4">
            {/* Option 1: Just robot emoji, same size as vinyl */}
            <div className="w-12 h-12 flex items-center justify-center text-2xl">
              🤖
            </div>
            
            {/* Option 2: Robot emoji inside spinning vinyl (uncomment to use) */}
            {/* 
            <div className="relative">
              <VinylRecord
                className="w-12 h-12"
                animationClass="animate-vinyl-spin" 
              />
              <div className="absolute inset-0 flex items-center justify-center text-lg">
                🤖
              </div>
            </div>
            */}
          </div>

          <div>
            <div className="flex items-center">
              <p className="font-semibold text-white font-concert text-lg">
                {player.user.displayName}
              </p>
              <span className="ml-2 text-neon-pink text-sm">(AI PLAYER)</span>
            </div>
            <p className="text-silver text-sm">
              {botInfo?.type || 'AI'} personality
            </p>
          </div>
        </div>

        {/* Status and Remove Button */}
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="text-right">
            {player.isReady ? (
              <div className="flex items-center text-lime-green font-medium animate-pulse">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>READY TO ROCK</span>
              </div>
            ) : (
              <div className="flex items-center text-stage-red">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>TUNING UP</span>
              </div>
            )}
          </div>

          {/* Remove button for host */}
          {canRemove && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="px-3 py-1 bg-gradient-to-r from-stage-red/20 to-red-600/20 text-stage-red border border-stage-red/40 rounded-lg hover:bg-stage-red/30 transition-all disabled:opacity-50 text-sm"
              title="Remove AI player"
            >
              {isRemoving ? (
                <VinylRecord className="w-4 h-4 animate-spin" />
              ) : (
                'Remove'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotPlayerDisplay;