// client/src/components/bot/BotPlayerDisplay.js - Fixed version

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
      
      // Call the parent callback directly - the parent handles the API call
      if (onRemoveBot) {
        await onRemoveBot(player.user._id);
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

  return (
    <div className={`bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-4 border transition-all ${
      player.isReady
        ? 'border-lime-green shadow-lg shadow-lime-green/20'
        : 'border-electric-purple/30'
    }`}>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* OPTION 1: Just robot emoji, same size as vinyl */}
          {/*
          <div className="relative mr-4">
            <div className="w-12 h-12 flex items-center justify-center text-2xl">
              🤖
            </div>
          </div>
          */}

          {/* OPTION 2: Robot emoji inside spinning vinyl (uncomment to use instead) */}
          <div className="relative mr-4">
            <VinylRecord
              className="w-12 h-12"
              animationClass="animate-vinyl-spin" 
            />
            <div className="absolute inset-0 flex items-center justify-center text-lg">
              🤖
            </div>
          </div>

          <div>
            <div className="flex items-center">
              <p className="font-semibold text-white font-concert text-lg">
                {player.user.displayName}
              </p>
              {/* REMOVED: <span className="ml-2 text-neon-pink text-sm">(AI PLAYER)</span> */}
            </div>
            <p className="text-silver text-sm capitalize">
              {botInfo.type.replace(/[_-]/g, ' ')} Bot
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
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>TUNING UP</span>
            </div>
          )}

          {/* FIXED Remove Button - Back to simple X */}
          {canRemove && (
            <button
              onClick={handleRemove}
              disabled={isRemoving}
              className="text-neon-pink hover:text-stage-red transition-colors disabled:opacity-50 p-1 rounded hover:bg-stage-red/10"
              title="Remove bot from game"
            >
              {isRemoving ? (
                <div className="w-5 h-5 border-2 border-stage-red border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
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