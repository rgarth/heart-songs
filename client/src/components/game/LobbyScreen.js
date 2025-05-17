// client/src/components/game/LobbyScreen.js - Using Home.js How to Play with numbered steps
import React, { useState } from 'react';
import { getRandomQuestion, submitCustomQuestion, leaveGame } from '../../services/gameService';
import VinylRecord from '../VinylRecord';

const LobbyScreen = ({ game, currentUser, onStartGame, onToggleReady }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuestionControls, setShowQuestionControls] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [leavingGame, setLeavingGame] = useState(false);

  // Find current user in players list
  const currentPlayer = game.players.find(p => p.user._id === currentUser.id);
  const isHost = game.host._id === currentUser.id;
  
  // Check if all non-host players are ready
  const allNonHostPlayersReady = game.players
    .filter(p => p.user._id !== game.host._id)
    .every(p => p.isReady);
  
  // Check if there are at least 2 players
  const hasEnoughPlayers = game.players.length >= 2;
  
  // Handle leaving the game - properly remove from server
  const handleLeaveGame = async () => {
    try {
      setLeavingGame(true);
      
      // Get the most up-to-date token
      const token = currentUser.accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token available');
        window.location.href = '/';
        return;
      }
      
      // Call the leaveGame API to properly remove player from server
      await leaveGame(game._id, token);
      
      // If player is ready, toggle them to not ready first as backup
      if (currentPlayer && currentPlayer.isReady && onToggleReady) {
        await onToggleReady();
      }
      
      // Navigate away after successful API call
      window.location.href = '/';
    } catch (error) {
      console.error('Error leaving game:', error);
      // Still navigate away even if there's an error
      window.location.href = '/';
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

  const handleShowQuestionControls = async () => {
    if (!isHost) return;
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(game._id, currentUser.accessToken);
      setNextQuestion(questionData.question);
      setShowQuestionControls(true);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to fetch question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSkipQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(game._id, currentUser.accessToken);
      setNextQuestion(questionData.question);
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to fetch question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitCustomQuestion = async () => {
    if (!customQuestion.trim()) {
      setError('Please enter a question');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await submitCustomQuestion(
        game._id, 
        customQuestion.trim(),
        currentUser.accessToken
      );
      
      setNextQuestion(questionData.question);
      setCustomQuestionMode(false);
    } catch (error) {
      console.error('Error submitting custom question:', error);
      setError('Failed to submit custom question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartWithQuestion = () => {
    if (!hasEnoughPlayers) {
      alert('You need at least 2 players to start the game');
      return;
    }
    
    if (!nextQuestion) {
      alert('No question selected');
      return;
    }
    
    if (!allNonHostPlayersReady) {
      setShowConfirmation(true);
    } else {
      onStartGame(nextQuestion);
    }
  };
  
  const confirmStart = () => {
    onStartGame(nextQuestion);
    setShowConfirmation(false);
  };
  
  const cancelStart = () => {
    setShowConfirmation(false);
  };
  
  const handleBackToLobby = () => {
    setShowQuestionControls(false);
    setNextQuestion(null);
    setCustomQuestionMode(false);
    setCustomQuestion('');
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
          {/* Band lineup - Vinyl record style */}
          <div className="mb-8">
            <div className="grid gap-4">
              {game.players.map(player => {
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
                            animationClass="animate-vinyl-spin group-hover:animate-spin-slow" />
                        </div>

                        <div>
                          <div className="flex items-center">
                            <p className="font-semibold text-white font-concert text-lg">
                              {player.user.displayName || player.user.username}
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
                
                <p className="text-xs text-silver mt-3">Send the code or invite link to your bandmates</p>
              </div>
            </div>
          </div>
          
          {/* Player controls - Leave game button for non-host */}
          {currentPlayer && !isHost && (
            <div className="text-center mb-8">
              <button
                onClick={handleLeaveGame}
                disabled={leavingGame}
                className="btn-stage px-8 py-3 disabled:opacity-50 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {leavingGame ? (
                    <>
                      <div className="vinyl-record w-5 h-5 animate-spin mr-3"></div>
                      LEAVING SHOW...
                    </>
                  ) : (
                    <>
                      LEAVE SHOW
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              
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
                /* Question selection - Mixing board style */
                <div className="bg-gradient-to-b from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                  {/* Back button */}
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={handleBackToLobby}
                      className="flex items-center text-silver hover:text-white transition-colors group"
                    >
                      <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Back to Lounge</span>
                    </button>
                    <div className="w-20"></div>
                  </div>
                  
                  {/* Question display/edit */}
                  {customQuestionMode ? (
                    <div className="mb-6">
                      <label className="block text-silver text-sm font-medium mb-2">
                        WRITE YOUR OWN QUESTION
                      </label>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="e.g., What song would you play at a robot wedding?"
                        className="w-full p-4 bg-vinyl-black text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all"
                        rows={3}
                      />
                      <div className="flex justify-center gap-3 mt-4">
                        <button
                          onClick={handleSubmitCustomQuestion}
                          disabled={loading || !customQuestion.trim()}
                          className="btn-electric text-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="vinyl-record w-4 h-4 animate-spin mr-2 inline-block"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              Use This Question
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setCustomQuestionMode(false)}
                          className="btn-stage text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border-l-4 border-neon-pink">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <p className="text-neon-pink font-bold text-xl mb-2">{nextQuestion?.text}</p>
                            <p className="text-silver text-sm">
                              <span className="bg-electric-purple/20 px-2 py-1 rounded">
                                {nextQuestion?.category}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Question controls */}
                      <div className="flex justify-center gap-3 mt-4">
                        <button
                          onClick={handleSkipQuestion}
                          disabled={loading}
                          className="btn-stage text-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="vinyl-record w-4 h-4 animate-spin mr-2 inline-block"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              Try Different Question
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setCustomQuestionMode(true)}
                          className="btn-electric text-sm"
                        >
                          Write Custom Question
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Start show button */}
                  {!customQuestionMode && (
                    <div className="text-center">
                      <button
                        onClick={handleStartWithQuestion}
                        className="btn-gold group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          START ROUND 1
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                      
                      {!allNonHostPlayersReady && (
                        <div className="mt-3 text-center">
                          <span className="text-yellow-400 text-sm">
                            Note: Not all players are ready. Only ready players will join the first song.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-4 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 text-center">
                      <span className="text-stage-red">{error}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Stage footer with how to play - COPIED EXACTLY FROM HOME.JS */}
        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 p-6 border-t border-electric-purple/20">
          <h4 className="text-lg font-rock text-center text-silver mb-6">How to Play</h4>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 - Exact copy from Home.js */}
            <div className="bg-gradient-to-b from-electric-purple/10 to-neon-pink/10 rounded-lg p-6 text-center border border-electric-purple/20">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <VinylRecord 
                  className="w-16 h-16"
                  animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                    1
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-electric-purple mb-2">Pick Your Songs</h3>
              <p className="text-sm text-silver">Answer quirky questions with the perfect track</p>
            </div>
            
            {/* Step 2 - Exact copy from Home.js */}
            <div className="bg-gradient-to-b from-turquoise/10 to-lime-green/10 rounded-lg p-6 text-center border border-turquoise/20">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <VinylRecord 
                  className="w-16 h-16"
                  animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                    2
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-turquoise mb-2">Vote & Vibe</h3>
              <p className="text-sm text-silver">Listen to everyone's picks and vote for favorites</p>
            </div>
            
            {/* Step 3 - Exact copy from Home.js */}
            <div className="bg-gradient-to-b from-gold-record/10 to-yellow-400/10 rounded-lg p-6 text-center border border-gold-record/20">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <VinylRecord 
                  className="w-16 h-16"
                  animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                    3
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gold-record mb-2">Win the Crowd</h3>
              <p className="text-sm text-silver">Score points and become the ultimate music maestro</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg p-6 max-w-md w-full border border-gold-record/40 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-rock text-gold-record mb-4">START THE ROUND ANYWAY?</h3>
              <p className="text-silver mb-6">
                Some band members aren't ready yet. Only prepared players will join the opening number.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={cancelStart}
                  className="btn-stage px-6"
                >
                  Wait for Band
                </button>
                <button 
                  onClick={confirmStart}
                  className="btn-gold px-6"
                >
                  Rock & Roll!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LobbyScreen;