// client/src/components/bot/AddBotButton.js
import React, { useState } from 'react';
import AddBotModal from './AddBotModal';

const AddBotButton = ({ 
  onAddBot, 
  gameId, 
  disabled = false, 
  maxPlayers = 6, 
  currentPlayerCount = 0,
  className = "",
  children 
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const canAddBot = currentPlayerCount < maxPlayers && !disabled;
  const spotsLeft = maxPlayers - currentPlayerCount;

  const handleAddBot = (result) => {
    setShowModal(false);
    if (onAddBot) {
      onAddBot(result);
    }
  };

  const getDisabledReason = () => {
    if (disabled) return 'Cannot add bots right now';
    if (currentPlayerCount >= maxPlayers) return 'Game is full';
    return '';
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!canAddBot}
        className={`
          btn-electric group relative overflow-hidden
          ${!canAddBot ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
        title={!canAddBot ? getDisabledReason() : 'Add AI player to the game'}
      >
        <span className="relative z-10 flex items-center justify-center">
          {children || (
            <>
              <span className="text-2xl mr-2">🤖</span>
              ADD AI PLAYER
            </>
          )}
        </span>
        {canAddBot && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        )}
      </button>

      {/* Show spots remaining */}
      {canAddBot && spotsLeft <= 3 && (
        <p className="text-xs text-silver mt-2 text-center">
          {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
        </p>
      )}

      <AddBotModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddBot={handleAddBot}
        gameId={gameId}
      />
    </>
  );
};

export default AddBotButton;