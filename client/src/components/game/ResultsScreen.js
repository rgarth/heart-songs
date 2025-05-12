// client/src/components/game/ResultsScreen.js
import React, { useState } from 'react';
import { getRandomQuestion, submitCustomQuestion } from '../../services/gameService';

const ResultsScreen = ({ game, currentUser, onNextRound, onEndGame }) => {
  // Separate passed and non-passed submissions
  const actualSubmissions = game.submissions.filter(s => !s.hasPassed);
  const passedSubmissions = game.submissions.filter(s => s.hasPassed);
  
  // Sort actual submissions by votes (most votes first)
  const sortedSubmissions = [...actualSubmissions].sort(
    (a, b) => b.votes.length - a.votes.length
  );
  
  // Check if current user is the host
  const isHost = game.host._id === currentUser.id;
  
  // Check if there are active players (from force start)
  const hasActivePlayers = game.activePlayers && game.activePlayers.length > 0;
  
  // Check if this was a small game (less than 3 players)
  const isSmallGame = (hasActivePlayers ? game.activePlayers.length : game.players.length) < 3;
  
  // Question preview states
  const [nextQuestion, setNextQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuestionPreview, setShowQuestionPreview] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState(null);
  const [showEndGameConfirmation, setShowEndGameConfirmation] = useState(false);
  
  // Function to fetch next question preview
  const handleShowNextQuestion = async () => {
    if (!isHost) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(game._id, currentUser.accessToken);
      setNextQuestion(questionData.question);
      setShowQuestionPreview(true);
    } catch (error) {
      console.error('Error fetching next question:', error);
      setError('Failed to fetch next question. Please try again.');
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
      console.error('Error fetching next question:', error);
      setError('Failed to fetch next question. Please try again.');
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
  
  // Function to play with selected question
  const handlePlayWithQuestion = () => {
    if (!nextQuestion) return;
    onNextRound(nextQuestion);
  };
  
  // End game functions
  const handleShowEndGameConfirmation = () => setShowEndGameConfirmation(true);
  const handleConfirmEndGame = () => {
    onEndGame();
    setShowEndGameConfirmation(false);
  };
  const handleCancelEndGame = () => setShowEndGameConfirmation(false);
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Round Results</h2>
        
        <div className="text-center mb-6">
          <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
        </div>
        
        {isSmallGame && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Note:</strong> In games with fewer than 3 players, players can vote for their own submission.</p>
          </div>
        )}
        
        {/* Pass Information */}
        {passedSubmissions.length > 0 && (
          <div className="mb-4 p-3 bg-gray-750 rounded-lg text-sm">
            <p className="text-gray-300">
              <strong>Players who passed:</strong> {passedSubmissions.map(s => s.player.displayName).join(', ')}
            </p>
          </div>
        )}
        
        {/* Results section */}
        {actualSubmissions.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Songs & Votes</h3>
            <div className="space-y-4">
              {sortedSubmissions.map((submission, index) => {
                const player = submission.player;
                const isCurrentUserSubmission = player._id === currentUser.id;
                
                return (
                  <div 
                    key={submission._id}
                    className={`bg-gray-750 rounded-lg overflow-hidden ${
                      index === 0 ? 'border-2 border-yellow-500' : ''
                    }`}
                  >
                    <div className="flex items-center p-4">
                      {submission.albumCover && (
                        <img 
                          src={submission.albumCover} 
                          alt={submission.songName} 
                          className="w-16 h-16 rounded mr-4" 
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium">{submission.songName}</p>
                          {index === 0 && (
                            <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                              Winner!
                            </span>
                          )}
                          {submission.gotSpeedBonus && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              Speed Bonus (+1)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{submission.artist}</p>
                        <div className="flex items-center mt-1">
                          <p className="text-sm">
                            Selected by: <span className="font-medium">{player.displayName}</span>
                            {isCurrentUserSubmission && (
                              <span className="ml-1 text-blue-400">(You)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {submission.votes.length}
                        </div>
                        <div className="text-xs text-gray-400">
                          {submission.votes.length === 1 ? 'vote' : 'votes'}
                        </div>
                      </div>
                    </div>
                    
                    {submission.votes.length > 0 && (
                      <div className="bg-gray-700 px-4 py-2">
                        <p className="text-sm text-gray-300">
                          Votes from: {submission.votes.map(voter => (
                            <span key={voter._id} className="font-medium">
                              {voter.displayName}
                              {voter._id === currentUser.id && <span className="text-blue-400"> (You)</span>}
                              {voter._id === player._id && <span className="text-yellow-400"> (Self-vote)</span>}
                              {', '}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center py-8">
            <p className="text-gray-400">No songs were submitted this round.</p>
            <p className="text-sm text-gray-500">All players passed on this question.</p>
          </div>
        )}
        
        {/* Scoreboard */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Scoreboard</h3>
          <div className="space-y-2">
            {game.players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((player, index) => {
                // Calculate total points for this player in the current round
                const playerSubmission = actualSubmissions.find(
                  sub => sub.player._id === player.user._id
                );
                
                let votesReceived = 0;
                let speedBonus = 0;
                let hasPassed = passedSubmissions.some(s => s.player._id === player.user._id);
                
                if (playerSubmission) {
                  votesReceived = playerSubmission.votes.length;
                  speedBonus = playerSubmission.gotSpeedBonus ? 1 : 0;
                }
                
                const roundPoints = votesReceived + speedBonus;
                
                return (
                  <div 
                    key={player.user._id}
                    className={`flex items-center justify-between bg-gray-700 p-3 rounded-lg ${
                      player.user._id === currentUser.id ? 'border border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-bold mr-3">{index + 1}.</span>
                      {player.user.profileImage && (
                        <img 
                          src={player.user.profileImage} 
                          alt={player.user.displayName} 
                          className="w-8 h-8 rounded-full mr-3" 
                        />
                      )}
                      <p className="font-medium">
                        {player.user.displayName}
                        {player.user._id === currentUser.id && (
                          <span className="ml-1 text-blue-400">(You)</span>
                        )}
                        {hasPassed && (
                          <span className="ml-2 text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                            Passed
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {roundPoints > 0 && (
                        <span className="text-green-400 text-sm mr-3">
                          +{roundPoints} this round
                          {speedBonus > 0 && <span className="text-xs ml-1">(includes speed bonus)</span>}
                        </span>
                      )}
                      <div className="font-bold">{player.score} pts</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        
        {/* Next Round Section */}
        {isHost && (
          <div className="text-center">
            {!showQuestionPreview ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleShowNextQuestion}
                  disabled={loading}
                  className="py-3 px-8 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Start Next Round'}
                </button>
                
                <button
                  onClick={handleShowEndGameConfirmation}
                  className="py-3 px-8 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  End Game
                </button>
              </div>
            ) : (
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-2">Next Question Preview</h3>
                
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
                        {loading ? 'Submitting...' : 'Set Question'}
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
                    <p className="text-yellow-400 font-medium text-xl mb-4">{nextQuestion?.text}</p>
                    <p className="text-gray-400 text-sm mb-4">Category: {nextQuestion?.category}</p>
                    
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handlePlayWithQuestion}
                        className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Play
                      </button>
                      <button
                        onClick={handleSkipQuestion}
                        disabled={loading}
                        className="py-2 px-4 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                      >
                        {loading ? 'Loading...' : 'Skip'}
                      </button>
                      <button
                        onClick={() => setCustomQuestionMode(true)}
                        className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Custom
                      </button>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="text-red-500 mb-2">
                    {error}
                  </div>
                )}
              </div>
            )}
            <p className="text-sm text-gray-400 mt-2">
              As the host, you control when the next round begins.
            </p>
          </div>
        )}
        
        {!isHost && (
          <div className="text-center text-gray-300">
            Waiting for the host to start the next round...
          </div>
        )}
        
        {/* End Game Confirmation Modal */}
        {showEndGameConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-purple-400">End Game Confirmation</h3>
              <p className="mb-6">
                Are you sure you want to end the game? This will show the final scores and winning songs from all rounds.
              </p>
              <div className="flex gap-4 justify-end">
                <button 
                  onClick={handleCancelEndGame}
                  className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmEndGame}
                  className="py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;