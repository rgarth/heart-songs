// client/src/components/game/LobbyScreen.js - Simplified Bot Integration
import React, { useState, useEffect } from 'react';
import { useGameStateActions } from '../../hooks/useGameStateActions';
import VinylRecord from '../VinylRecord';
import HowToPlay from '../HowToPlay';
import QuestionSelector from './QuestionSelector';
import ActionButton from '../ActionButton';
import ActionError from '../ActionError';

// Import only what we need from bot components
import { BotPlayerDisplay, botService } from '../bot';

const LobbyScreen = ({ game, currentUser, onStartGame, onToggleReady }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showQuestionControls, setShowQuestionControls] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [leavingGame, setLeavingGame] = useState(false);

  // Bot-related state - simplified
  const [botPersonalities, setBotPersonalities] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState('eclectic');
  const [isAddingBot, setIsAddingBot] = useState(false);
  const [botError, setBotError] = useState(null);

  // Use the game state actions hook
  const { actions, isPending, getError, clearError } = useGameStateActions(game._id);

  // Find current user in players list
  const currentPlayer = game.players.find(p => p.user._id === currentUser.id);
  const isHost = game.host._id === currentUser.id;
  
  // Check if all non-host players are ready
  const allNonHostPlayersReady = game.players
    .filter(p => p.user._id !== game.host._id)
    .every(p => p.isReady);
  
  // Check if there are at least 2 players
  const hasEnoughPlayers = game.players.length >= 2;

  // Check if there's already a bot in the game
  const hasBot = game.players.some(p => botService.isBot(p.user.displayName));

  // Load bot personalities on mount
  useEffect(() => {
    const loadPersonalities = async () => {
      try {
        const personalities = await botService.getPersonalities();
        setBotPersonalities(personalities);
        if (personalities.length > 0) {
          setSelectedPersonality(personalities[0].id);
        }
      } catch (error) {
        console.error('Failed to load bot personalities:', error);
      }
    };

    if (isHost) {
      loadPersonalities();
    }
  }, [isHost]);
  
  // Handle leaving the game - properly remove from server
  const handleLeaveGame = async () => {
    try {
      setLeavingGame(true);
      
      // Call the leaveGame API to properly remove player from server
      await actions.leaveGame();
      
      // Navigate away after successful API call
      window.location.href = '/';
    } catch (error) {
      console.error('Error leaving game:', error);
      // Still navigate away even if there's an error
      window.location.href = '/';
    } finally {
      setLeavingGame(false);
    }
  };

  // Copy game code to clipboard
  const copyGameCode = () => {
    if (!game || !game.gameCode) return;
    
    try {
      navigator.clipboard.writeText(game.gameCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Handle sharing game code
  const handleShareGameCode = async () => {
    const joinUrl = `${window.location.origin}/join/${game.gameCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Heart Songs Game Invite',
          text: 'Join my Heart Songs game!',
          url: joinUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
        copyToClipboard(joinUrl);
      }
    } else {
      copyToClipboard(joinUrl);
    }
  };

  const copyToClipboard = (url) => {
    try {
      navigator.clipboard.writeText(url);
      alert('Game invite link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Show question controls
  const handleShowQuestionControls = () => {
    setShowQuestionControls(true);
  };
  
  // Handle question selection from QuestionSelector - with action management
  const handleQuestionSelected = async (question) => {
    setSelectedQuestion(question);
    setShowQuestionControls(false);
    
    // Check if we should show confirmation or start directly
    if (!hasEnoughPlayers) {
      alert('You need at least 2 players to start the game');
      return;
    }
    
    if (!allNonHostPlayersReady) {
      setShowConfirmation(true);
    } else {
      try {
        await actions.startGame(currentUser.id, question);
        // Game state will be updated via polling in Game.js
      } catch (error) {
        console.error('Failed to start game:', error);
      }
    }
  };

  // Handle going back from question selector
  const handleBackToLobby = () => {
    setShowQuestionControls(false);
    setSelectedQuestion(null);
  };
  
  // Confirm start with action management
  const confirmStart = async () => {
    try {
      await actions.startGame(currentUser.id, selectedQuestion);
      setShowConfirmation(false);
      // Game state will be updated via polling in Game.js
    } catch (error) {
      console.error('Failed to start game:', error);
      // Error is shown via ActionError component
    }
  };
  
  const cancelStart = () => {
    setShowConfirmation(false);
    setSelectedQuestion(null);
  };

  // Handle adding a bot - simplified
  const handleAddBot = async () => {
    if (hasBot || isAddingBot) return;

    try {
      setIsAddingBot(true);
      setBotError(null);
      
      const result = await botService.addBotToGame(game._id, selectedPersonality);
      console.log('Bot added to game:', result);
      // The game state will be updated via polling in Game.js
      
    } catch (error) {
      console.error('Failed to add bot:', error);
      setBotError(error.message || 'Failed to add AI player');
    } finally {
      setIsAddingBot(false);
    }
  };

  // Handle removing a bot from the game
  const handleRemoveBot = async (botId) => {
    console.log('Removing bot:', botId);
    // The actual removal is handled by BotPlayerDisplay component
    // Game state will be updated via polling in Game.js
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main stage card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* Stage header */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
            THE LINEUP
          </h2>
          <p className="text-silver text-center mt-2">Getting the band together...</p>
        </div>
        
        <div className="p-6">
          
          {/* Action Errors */}
          <ActionError 
            error={getError('toggleReady') || getError('startGame') || getError('leaveGame')} 
            onDismiss={() => {
              clearError('toggleReady');
              clearError('startGame');
              clearError('leaveGame');
            }}
            className="mb-6"
          />
          
          {/* Band lineup - with bot support */}
          <div className="mb-8">
            <div className="grid gap-4">
              {game.players.map(player => {
                const isBot = botService.isBot(player.user.displayName);
                
                if (isBot) {
                  return (
                    <BotPlayerDisplay
                      key={player.user._id}
                      player={player}
                      onRemoveBot={handleRemoveBot}
                      canRemove={isHost}
                      gameId={game._id}
                    />
                  );
                } else {
                  // Regular human player display
                  return (
                    <div
                      key={player.user._id}
                      className={`bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-4 border transition-all ${player.isReady
                          ? 'border-lime-green shadow-lg shadow-lime-green/20'
                          : 'border-electric-purple/30'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="relative mr-4">
                            <VinylRecord
                              className="w-12 h-12 relative z-10"
                              animationClass="animate-vinyl-spin group-hover:animate-vinyl-spin" />
                          </div>

                          <div>
                            <div className="flex items-center">
                              <p className="font-semibold text-white font-concert text-lg">
                                {player.user.displayName || player.user.username}
                                {player.user._id === currentUser.id && (
                                  <span className="ml-2 text-neon-pink">(YOU)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status indicator */}
                        <div className="text-right">
                          {player.user._id === game.host._id ? (
                            <div className="flex items-center text-gold-record font-medium">
                              <span>MC</span>
                            </div>
                          ) : player.isReady ? (
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
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
          
          {/* Game code section - styled like header dropdown */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border-l-4 border-gold-record">
              <div className="text-center">
                <div className="text-silver text-sm font-medium mb-3">GAME CODE</div>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl font-rock neon-gold tracking-widest font-mono">
                    {game.gameCode}
                  </span>
                </div>
                
                {/* Copy and Share buttons */}
                <div className="flex justify-center gap-4">
                  <button
                    onClick={copyGameCode}
                    className="py-2 px-4 bg-gradient-to-r from-electric-purple to-neon-pink rounded-full hover:shadow-neon-purple transition-all group text-sm font-medium"
                    aria-label="Copy game code"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      {copySuccess ? 'COPIED!' : 'COPY CODE'}
                    </span>
                  </button>
                  
                  <button 
                    onClick={handleShareGameCode}
                    className="py-2 px-4 bg-gradient-to-r from-turquoise to-lime-green rounded-full hover:shadow-turquoise transition-all group text-sm font-medium"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      SHARE INVITE
                    </span>
                  </button>
                </div>
                
                <p className="text-xs text-silver mt-3">Send the code or invite link to your friends</p>
              </div>
            </div>
          </div>

          {/* Neon-themed AI Player Section - Only for Host */}
          {isHost && !hasBot && game.players.length < 6 && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                <div className="text-center">
                  <h3 className="text-lg font-rock text-neon-pink mb-3 flex items-center justify-center">
                    <span className="text-2xl mr-2">🤖</span>
                    ADD AI BAND MEMBER
                  </h3>
                  <p className="text-silver text-sm mb-4">Need an extra player? Add an AI with different music tastes</p>
                  
                  <div className="flex items-center justify-center gap-3">
                    {/* Neon-themed Personality Dropdown */}
                    <select
                      value={selectedPersonality}
                      onChange={(e) => setSelectedPersonality(e.target.value)}
                      className="bg-gradient-to-r from-vinyl-black to-stage-dark text-white rounded-lg px-4 py-2 border-2 border-electric-purple/40 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all font-concert text-sm min-w-[200px]"
                      disabled={isAddingBot}
                    >
                      {botPersonalities.map(personality => {
                        // Create more descriptive text based on personality
                        const getPersonalityDescription = (p) => {
                          switch(p.id) {
                            case 'eclectic':
                              return 'Eclectic Bot - Loves everything';
                            case 'mainstream':
                              return 'Chart Topper - Only the hits';
                            case 'indie':
                              return 'Indie Insider - Underground gems';
                            case 'vintage':
                              return 'Time Traveler - Classic tracks';
                            case 'analytical':
                              return 'Music Scholar - Deep knowledge';
                            default:
                              return `${p.name} - ${p.description.split(' ').slice(0, 3).join(' ')}`;
                          }
                        };
                        
                        return (
                          <option key={personality.id} value={personality.id}>
                            {getPersonalityDescription(personality)}
                          </option>
                        );
                      })}
                    </select>
                    
                    {/* Neon Add Button */}
                    <button
                      onClick={handleAddBot}
                      disabled={isAddingBot || hasBot}
                      className="px-6 py-2 bg-gradient-to-r from-electric-purple to-neon-pink text-white rounded-lg font-rock hover:shadow-lg hover:shadow-neon-pink/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-electric-purple/30 hover:border-neon-pink/60 text-sm font-bold tracking-wide"
                    >
                      {isAddingBot ? (
                        <>
                          <VinylRecord className="w-4 h-4 animate-spin mr-2 inline-block" />
                          ADDING...
                        </>
                      ) : (
                        'ADD BOT'
                      )}
                    </button>
                  </div>
                  
                  {/* Bot Error */}
                  {botError && (
                    <div className="mt-4 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3">
                      <div className="flex items-center justify-center text-stage-red text-sm">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        {botError}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Player controls - Leave game button for non-host */}
          {currentPlayer && !isHost && (
            <div className="text-center mb-8">
              <ActionButton
                onClick={handleLeaveGame}
                isLoading={leavingGame}
                loadingText="LEAVING SHOW..."
                className="btn-stage px-8 py-3 group relative overflow-hidden"
              >
                LEAVE SHOW
              </ActionButton>
              
              <div className="mt-4">
                {allNonHostPlayersReady ? (
                  <div className="inline-flex items-center bg-lime-green/20 rounded-full px-4 py-2 border border-lime-green/40">
                    <span className="text-lime-green font-medium">Waiting for the game to start...</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center bg-electric-purple/20 rounded-full px-4 py-2 border border-electric-purple/40">
                    <div className="vinyl-record w-4 h-4 animate-spin mr-2"></div>
                    <span className="text-silver">Waiting for the band to assemble...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Host controls */}
          {currentPlayer && isHost && (
            <>
              {!showQuestionControls ? (
                <div className="text-center mb-8">
                  <div className="space-y-4">
                    {hasEnoughPlayers && (
                      <button
                        onClick={handleShowQuestionControls}
                        className="btn-electric group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          CHOOSE THE FIRST QUESTION
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Question Selection using new QuestionSelector component */
                <div className="mb-8">
                  <QuestionSelector
                    gameId={game._id}
                    accessToken={currentUser.accessToken}
                    onQuestionSelected={handleQuestionSelected}
                    onCancel={handleBackToLobby}
                    autoLoad={true}
                    confirmButtonText="START GAME"
                    title="CHOOSE THE FIRST QUESTION"
                    showBackButton={true}
                  />
                  {!allNonHostPlayersReady && (
                    <div className="mt-4 text-center">
                      <span className="text-yellow-400 text-sm">
                        Note: Not all players are ready. Only ready players will join the first song.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Stage footer with how to play */}
        <HowToPlay />
      </div>
      
      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg p-6 max-w-md w-full border border-gold-record/40 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-rock text-gold-record mb-4">START THE ROUND ANYWAY?</h3>
              <p className="text-silver mb-6">
                Some players aren't ready yet.
              </p>
              
              {/* Show action error in confirmation dialog */}
              <ActionError 
                error={getError('startGame')} 
                onDismiss={() => clearError('startGame')}
                className="mb-4"
              />
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={cancelStart}
                  className="btn-stage px-6"
                >
                  Wait for Band
                </button>
                <ActionButton 
                  onClick={confirmStart}
                  isLoading={isPending('startGame')}
                  loadingText="Starting..."
                  className="btn-gold px-6"
                >
                  Rock & Roll!
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;