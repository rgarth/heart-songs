// client/src/components/game/LobbyScreen.js - Rockstar Design Edition
import React, { useState } from 'react';
import { getRandomQuestion, submitCustomQuestion } from '../../services/gameService';

const LobbyScreen = ({ game, currentUser, onToggleReady, onStartGame }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [nextQuestion, setNextQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuestionControls, setShowQuestionControls] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState(null);

  // Find current user in players list
  const currentPlayer = game.players.find(p => p.user._id === currentUser.id);
  const isHost = game.host._id === currentUser.id;
  
  // Check if all non-host players are ready
  const allNonHostPlayersReady = game.players
    .filter(p => p.user._id !== game.host._id)
    .every(p => p.isReady);
  
  // Check if there are at least 2 players
  const hasEnoughPlayers = game.players.length >= 2;
  
  // Count of ready players (excluding host)
  const readyCount = game.players
    .filter(p => p.user._id !== game.host._id)
    .filter(p => p.isReady).length;
  
  // Total non-host players
  const totalNonHostPlayers = game.players.length - 1;

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
            🎤 BACKSTAGE LOUNGE 🎤
          </h2>
          <p className="text-silver text-center mt-2">Getting the band together...</p>
        </div>
        
        {/* Share invite - Concert ticket style */}
        <div className="p-6 border-b border-electric-purple/20">
          <div className="text-center">
            <button 
              onClick={handleShareGameCode}
              className="inline-flex items-center btn-electric group"
            >
              <span className="mr-3">🎟️</span>
              SHARE CONCERT INVITE
              <span className="ml-3">🎟️</span>
              <div className="ml-2 equalizer">
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>
            </button>
            <p className="text-silver text-sm mt-2">Send this link to your bandmates</p>
          </div>
        </div>
        
        <div className="p-6">
          {/* Band lineup - Vinyl record style */}
          <div className="mb-8">
            <h3 className="text-2xl font-rock text-gold-record mb-4 text-center flex items-center justify-center">
              <span className="mr-2">🎸</span>
              THE LINEUP
              <span className="ml-2">🎸</span>
              <span className="ml-3 text-lg text-silver">({game.players.length})</span>
            </h3>
            
            <div className="grid gap-4">
              {game.players.map(player => (
                <div 
                  key={player.user._id} 
                  className={`bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-4 border transition-all ${
                    player.isReady 
                      ? 'border-lime-green shadow-lg shadow-lime-green/20' 
                      : 'border-electric-purple/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {/* Vinyl record avatar */}
                      <div className="relative mr-4">
                        {player.user.profileImage ? (
                          <img 
                            src={player.user.profileImage} 
                            alt={player.user.displayName || player.user.username} 
                            className="w-12 h-12 rounded-full border-2 border-gold-record"
                          />
                        ) : (
                          <div className="vinyl-record w-12 h-12">
                            <div className="absolute inset-0 flex items-center justify-center text-gold-record text-lg">
                              ♪
                            </div>
                          </div>
                        )}
                        {player.isReady && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-lime-green rounded-full border-2 border-stage-dark flex items-center justify-center animate-pulse">
                            <span className="text-xs">✓</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <p className="font-semibold text-white font-concert text-lg">
                            {player.user.displayName || player.user.username}
                          </p>
                          {player.user._id === game.host._id && (
                            <span className="ml-3 px-2 py-1 bg-gradient-to-r from-gold-record to-yellow-400 text-vinyl-black text-xs font-bold rounded-full">
                              🎼 BANDLEADER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-silver">Score: </span>
                          <span className="ml-1 text-gold-record font-semibold">{player.score}</span>
                          <span className="ml-1 text-gold-record">♪</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className="text-right">
                      {player.user._id === game.host._id ? (
                        <div className="flex items-center text-gold-record font-medium">
                          <span className="mr-2">👑</span>
                          <span>HOST</span>
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
              ))}
            </div>
          </div>
          
          {/* Player controls - Non-host */}
          {currentPlayer && !isHost && (
            <div className="text-center mb-8">
              <button
                onClick={onToggleReady}
                disabled={!hasEnoughPlayers && !currentPlayer.isReady}
                className={`btn-rockstar relative overflow-hidden group ${
                  currentPlayer.isReady 
                    ? 'bg-gradient-to-r from-stage-red to-red-600 hover:from-red-700 hover:to-stage-red' 
                    : hasEnoughPlayers
                      ? 'bg-gradient-to-r from-lime-green to-green-600 hover:from-green-600 hover:to-lime-green'
                      : 'bg-gray-600 cursor-not-allowed opacity-50'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {currentPlayer.isReady ? (
                    <>
                      <span className="mr-2">⏹️</span>
                      LEAVE STAGE
                      <span className="ml-2">⏹️</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🚀</span>
                      JOIN THE JAM
                      <span className="ml-2">🚀</span>
                    </>
                  )}
                </span>
                {hasEnoughPlayers && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                )}
              </button>
              
              <div className="mt-4">
                {allNonHostPlayersReady ? (
                  <div className="inline-flex items-center bg-lime-green/20 rounded-full px-4 py-2 border border-lime-green/40">
                    <span className="text-lime-green mr-2">✨</span>
                    <span className="text-lime-green font-medium">Everyone's ready! Waiting for the bandleader...</span>
                    <span className="text-lime-green ml-2">✨</span>
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
                          <span className="mr-3">🎯</span>
                          CHOOSE SETLIST & START SHOW
                          <span className="ml-3">🎯</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    {!hasEnoughPlayers ? (
                      <div className="inline-flex items-center bg-stage-red/20 rounded-full px-4 py-2 border border-stage-red/40">
                        <span className="text-stage-red mr-2">⚠️</span>
                        <span className="text-stage-red font-medium">Need at least 2 players to start the show</span>
                        <span className="text-stage-red ml-2">⚠️</span>
                      </div>
                    ) : allNonHostPlayersReady ? (
                      <div className="inline-flex items-center bg-gold-record/20 rounded-full px-4 py-2 border border-gold-record/40">
                        <span className="text-gold-record mr-2">🎤</span>
                        <span className="text-gold-record font-medium">Band is ready! Choose your setlist to begin</span>
                        <span className="text-gold-record ml-2">🎤</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center bg-electric-purple/20 rounded-full px-4 py-2 border border-electric-purple/40">
                        <span className="text-silver">{readyCount}/{totalNonHostPlayers} players ready for the show</span>
                      </div>
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
                    <h3 className="text-xl font-rock text-neon-pink">🎵 SETLIST SELECTION 🎵</h3>
                    <div className="w-20"></div>
                  </div>
                  
                  {/* Question display/edit */}
                  {customQuestionMode ? (
                    <div className="mb-6">
                      <label className="block text-silver text-sm font-medium mb-2">
                        ✏️ Write Your Own Musical Challenge
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
                              <span className="mr-2">💾</span>
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
                          <div className="text-4xl mr-4">🎭</div>
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
                              <span className="mr-2">🔄</span>
                              Try Different Question
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setCustomQuestionMode(true)}
                          className="btn-electric text-sm"
                        >
                          <span className="mr-2">✏️</span>
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
                          <span className="mr-3">🚀</span>
                          START THE SHOW
                          <span className="ml-3">🚀</span>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      </button>
                      
                      {!allNonHostPlayersReady && (
                        <div className="mt-3 text-center">
                          <span className="text-yellow-400 text-sm">
                            ⚡ Note: Not all players are ready. Only ready players will join the first song.
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
          
          {/* Game information - Hidden until needed */}
          {(!hasEnoughPlayers || game.players.length < 3) && (
            <div className="mt-8 bg-gradient-to-r from-turquoise/10 to-lime-green/10 rounded-lg p-4 border border-turquoise/30">
              <h4 className="text-turquoise font-semibold mb-2 text-center">🎵 Concert Info 🎵</h4>
              <div className="text-sm text-silver space-y-2">
                {!hasEnoughPlayers && (
                  <div className="flex items-center">
                    <span className="text-stage-red mr-2">⚠️</span>
                    <span>Need <strong>2+ players</strong> for the show to begin</span>
                  </div>
                )}
                {game.players.length < 3 && hasEnoughPlayers && (
                  <div className="flex items-center">
                    <span className="text-turquoise mr-2">ℹ️</span>
                    <span>In small concerts (2 players), you can vote for your own performance</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Stage footer with how to play */}
        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 p-6 border-t border-electric-purple/20">
          <details className="group">
            <summary className="text-center cursor-pointer">
              <span className="text-silver hover:text-white transition-colors font-medium">
                🎸 How to Rock the Stage 🎸
              </span>
            </summary>
            <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🎵</div>
                <h5 className="text-electric-purple font-semibold mb-1">Pick Songs</h5>
                <p className="text-silver">Choose tracks that answer the question</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🗳️</div>
                <h5 className="text-turquoise font-semibold mb-1">Vote</h5>
                <p className="text-silver">Listen and vote for favorites</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🏆</div>
                <h5 className="text-gold-record font-semibold mb-1">Win</h5>
                <p className="text-silver">Score points and dominate</p>
              </div>
            </div>
          </details>
        </div>
      </div>
      
      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg p-6 max-w-md w-full border border-gold-record/40 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h3 className="text-xl font-rock text-gold-record mb-4">START THE SHOW ANYWAY?</h3>
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
                  🚀 Rock & Roll!
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