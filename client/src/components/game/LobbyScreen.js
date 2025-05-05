// client/src/components/game/LobbyScreen.js
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
    .filter(p => p.user._id !== game.host._id) // Filter out the host
    .every(p => p.isReady);
  
  // Check if there are at least 2 players
  const hasEnoughPlayers = game.players.length >= 2;
  
  // Count of ready players (excluding host)
  const readyCount = game.players
    .filter(p => p.user._id !== game.host._id) // Don't count the host
    .filter(p => p.isReady).length;
  
  // Total non-host players
  const totalNonHostPlayers = game.players.length - 1;

  // Handle sharing game code
  const handleShareGameCode = async () => {
    // Create direct join URL
    const joinUrl = `${window.location.origin}/join/${game.gameCode}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Heart Songs Game Invite',
          text: 'Join my Heart Songs game!',
          url: joinUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to clipboard copy if sharing fails
        copyToClipboard(joinUrl);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(joinUrl);
    }
  };

  // Fallback: copy to clipboard
  const copyToClipboard = (url) => {
    try {
      navigator.clipboard.writeText(url);
      // You could add a toast notification here if you had a notification system
      alert('Game invite link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Function to show question controls and fetch first question
  const handleShowQuestionControls = async () => {
    if (!isHost) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Make sure we're passing the correct token
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
  
  // Function to skip to another question
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
  
  // Function to submit custom question
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
  
  // Start game with selected question
  const handleStartWithQuestion = () => {
    if (!hasEnoughPlayers) {
      alert('You need at least 2 players to start the game');
      return;
    }
    
    if (!nextQuestion) {
      alert('No question selected');
      return;
    }
    
    // Only show confirmation if non-host players aren't ready
    if (!allNonHostPlayersReady) {
      setShowConfirmation(true);
    } else {
      // All non-host players are ready, so start immediately
      onStartGame(nextQuestion);
    }
  };
  
  // Confirm starting with not-ready players
  const confirmStart = () => {
    onStartGame(nextQuestion);
    setShowConfirmation(false);
  };
  
  // Cancel start
  const cancelStart = () => {
    setShowConfirmation(false);
  };
  
  // Reset question selection
  const handleBackToLobby = () => {
    setShowQuestionControls(false);
    setNextQuestion(null);
    setCustomQuestionMode(false);
    setCustomQuestion('');
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Waiting for Players</h2>
        
        {/* Game code display - enlarged and highlighted with share button */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Game Code:</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold tracking-wider bg-gray-700 inline-block px-4 py-2 rounded-lg text-yellow-400">
              {game.gameCode}
            </p>
            <button 
              onClick={handleShareGameCode}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
              aria-label="Share game code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this code with friends to let them join</p>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Players ({game.players.length})</h3>
          <div className="space-y-3">
            {game.players.map(player => (
              <div 
                key={player.user._id} 
                className={`flex items-center justify-between bg-gray-700 p-3 rounded-lg ${
                  player.isReady ? 'border-l-4 border-green-500' : ''
                }`}
              >
                <div className="flex items-center">
                  {player.user.profileImage && (
                    <img 
                      src={player.user.profileImage} 
                      alt={player.user.displayName || player.user.username} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {player.user.displayName || player.user.username}
                      {player.user._id === game.host._id && (
                        <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">Host</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">Score: {player.score}</p>
                  </div>
                </div>
                <div>
                  {player.user._id === game.host._id ? (
                    // The host is always shown as "Host" instead of Ready/Not Ready
                    <span className="text-yellow-500 font-medium">Host</span>
                  ) : player.isReady ? (
                    <span className="text-green-500 font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Ready
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">Not Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Player controls (non-host) */}
        {currentPlayer && !isHost && (
          <div className="text-center flex flex-col items-center gap-4">
            <button
              onClick={onToggleReady}
              disabled={!hasEnoughPlayers && !currentPlayer.isReady}
              className={`py-3 px-6 rounded-lg font-medium ${
                currentPlayer.isReady 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : hasEnoughPlayers
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              {currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up'}
            </button>
            
            <p className="text-gray-400 text-sm">
              {allNonHostPlayersReady 
                ? "All players are ready! Waiting for the host to start the game..." 
                : "Waiting for all players to be ready..."}
            </p>
          </div>
        )}
        
        {/* Host controls */}
        {currentPlayer && isHost && (
          <>
            {!showQuestionControls ? (
              <div className="text-center flex flex-col items-center gap-4">
                {/* Only show the Choose Question button for host (no Ready Up button) */}
                {hasEnoughPlayers && (
                  <button
                    onClick={handleShowQuestionControls}
                    className="py-3 px-6 rounded-lg font-medium bg-yellow-600 hover:bg-yellow-700"
                  >
                    Choose Question & Start Game
                  </button>
                )}
                
                <p className="text-gray-400 text-sm mt-2">
                  {!hasEnoughPlayers 
                    ? "Need at least 2 players to start" 
                    : allNonHostPlayersReady 
                      ? "All players are ready! Choose a question to start the game." 
                      : `${readyCount}/${totalNonHostPlayers} players ready`}
                </p>
              </div>
            ) : (
              <div className="bg-gray-700 p-4 rounded-lg">
                {/* Back button */}
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={handleBackToLobby}
                    className="flex items-center text-gray-400 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back
                  </button>
                  <h3 className="text-lg font-medium">Choose Question</h3>
                  <div className="w-10"></div> {/* Empty space for symmetry */}
                </div>
                
                {/* Question editing section */}
                {customQuestionMode ? (
                  <div className="mb-4">
                    <textarea
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Enter your custom question..."
                      className="w-full p-3 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      rows={3}
                    />
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleSubmitCustomQuestion}
                        disabled={loading || !customQuestion.trim()}
                        className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Use This Question'}
                      </button>
                      <button
                        onClick={() => setCustomQuestionMode(false)}
                        className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-600">
                      <p className="text-yellow-400 font-medium text-xl mb-2">{nextQuestion?.text}</p>
                      <p className="text-gray-400 text-sm">Category: {nextQuestion?.category}</p>
                    </div>
                    
                    <div className="flex justify-center gap-2 mb-4">
                      <button
                        onClick={handleSkipQuestion}
                        disabled={loading}
                        className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Loading...' : 'Try Different Question'}
                      </button>
                      <button
                        onClick={() => setCustomQuestionMode(true)}
                        className="py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Write Custom Question
                      </button>
                    </div>
                    
                    <button
                      onClick={handleStartWithQuestion}
                      className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                      Start Game with This Question
                    </button>
                    {!allNonHostPlayersReady && (
                      <p className="text-yellow-400 text-sm mt-2">
                        Note: Not all players are ready. Only ready players will participate.
                      </p>
                    )}
                  </div>
                )}
                
                {error && (
                  <div className="text-red-500 text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        {/* Confirmation dialog for starting with not-ready players */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Start Game Confirmation</h3>
              <p className="mb-6">
                Not all players are ready. Only players who are ready will be able to submit songs and vote in the first round.
                Are you sure you want to start?
              </p>
              <div className="flex gap-4 justify-end">
                <button 
                  onClick={cancelStart}
                  className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmStart}
                  className="py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Start Anyway
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Game information */}
        <div className="mt-6 text-center text-gray-400">
          {!hasEnoughPlayers && (
            <div className="text-yellow-500 font-medium mb-2">
              At least 2 players are required to start the game. Waiting for more players to join...
            </div>
          )}
          
          {game.players.length < 3 && hasEnoughPlayers && (
            <div className="mt-2 text-blue-400">
              Note: In games with fewer than 3 players, you can vote for your own submission.
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-2">How to Play</h3>
          <ol className="list-decimal pl-5 space-y-1 text-gray-300">
            <li>Once everyone is ready, you'll see a random question</li>
            <li>Select a song from Spotify that answers the question</li>
            <li>After everyone has chosen, all songs are revealed</li>
            <li>Vote for your favorite answer {game.players.length < 3 ? "(you can vote for your own)" : "(except your own)"}</li>
            <li>Points are awarded based on votes</li>
            <li>Play multiple rounds to determine the winner!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;