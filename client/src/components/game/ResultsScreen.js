// Debug version of ResultsScreen.js - with extensive logging
import React, { useState } from 'react';
import { getRandomQuestion, submitCustomQuestion } from '../../services/gameService';
import VinylRecord from '../VinylRecord';

const ResultsScreen = ({ game, currentUser, onNextRound, onEndGame, onMoveToQuestionSelection, getWinnerInfo }) => {
  // Separate passed and non-passed submissions
  const actualSubmissions = game.submissions.filter(s => !s.hasPassed);
  const passedSubmissions = game.submissions.filter(s => s.hasPassed);
  
  // Sort actual submissions by votes (most votes first)
  const sortedSubmissions = [...actualSubmissions].sort(
    (a, b) => b.votes.length - a.votes.length
  );
  
  // Check if current user is the host
  const isHost = game.host._id === currentUser.id;
  
  // Get winner info using the provided function
  const winnerInfo = getWinnerInfo ? getWinnerInfo() : { winner: null, isTie: false, reason: 'no_winner_function' };
  const { winner, isTie, reason, tiedPlayers } = winnerInfo;
  const isCurrentUserWinner = winner && winner._id === currentUser.id;
  
  // FIXED: Better logic for showing winner choose button
  const showWinnerChooseButton = winner && 
                                 !isCurrentUserWinner && 
                                 reason !== 'all_passed' && 
                                 actualSubmissions.length > 0;
  
  // Question preview states
  const [nextQuestion, setNextQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showQuestionControls, setShowQuestionControls] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState(null);
  const [showEndGameConfirmation, setShowEndGameConfirmation] = useState(false);
  
  // Progressive disclosure states
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  // Function to fetch next question preview
  const handleShowNextQuestion = async () => {
    if (!isHost) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(game._id, currentUser.accessToken);
      setNextQuestion(questionData.question);
      setShowQuestionControls(true);
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

  // Get top 3 players for compact leaderboard
  const sortedPlayers = game.players
    .slice()
    .sort((a, b) => b.score - a.score);
  const top3Players = sortedPlayers.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Main stage card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* PRIORITY 1: Winner Announcement + What's Next */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-rock neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-4">
              ROUND COMPLETE
            </h2>
            
            {/* UPDATED: Winner Display with proper handling of no-winner scenarios */}
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record mb-4">
              <div className="flex items-center justify-center">
                <div className="mr-4">
                  <VinylRecord className="w-12 h-12" animationClass="animate-vinyl-spin" />
                </div>
                <div>
                  {reason === 'all_passed' || actualSubmissions.length === 0 ? (
                    <p className="text-silver font-bold text-xl">
                      NO WINNER - ALL PLAYERS PASSED
                    </p>
                  ) : isTie ? (
                    <p className="text-gold-record font-bold text-xl">
                      TIE: {tiedPlayers?.map(p => p.displayName).join(' & ')}
                    </p>
                  ) : winner ? (
                    <p className="text-gold-record font-bold text-xl">
                      WINNER: {winner.displayName || 'Unknown'}
                    </p>
                  ) : (
                    <p className="text-silver font-bold text-xl">
                      NO WINNER
                    </p>
                  )}
                  
                  {/* Show winning song only if there were actual submissions */}
                  {sortedSubmissions[0] && !sortedSubmissions[0].hasPassed && (
                    <p className="text-silver text-sm">
                      "{sortedSubmissions[0].songName}" by {sortedSubmissions[0].artist}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Current Question Reminder */}
            <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-3 border border-electric-purple/30">
              <p className="text-neon-pink font-medium text-lg">{game.currentQuestion.text}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          
          {/* PRIORITY 2: MC Controls (Always Visible for Host) */}
          {isHost && (
            <div className="mb-8 bg-gradient-to-r from-deep-space/60 to-stage-dark/60 rounded-lg p-6 border border-gold-record/40 sticky top-4 z-10">
              <h3 className="text-xl font-rock text-center mb-6 text-gold-record">
                MC CONTROLS
              </h3>
              
              {!showQuestionControls ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quick Next Round */}
                  <button
                    onClick={handleShowNextQuestion}
                    disabled={loading}
                    className="btn-electric disabled:opacity-50 group col-span-1 md:col-span-2"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <VinylRecord className="w-5 h-5 animate-spin mr-3" />
                          LOADING...
                        </>
                      ) : (
                        <>
                          START NEXT ROUND
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>


                  {/* UPDATED: Only show "Let Winner Choose" if there's actually a winner */}
                  {showWinnerChooseButton && (
                    <button
                      onClick={onMoveToQuestionSelection}
                      className="btn-gold group"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        WINNER CHOOSES
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  )}

                  {/* End Game */}
                  <button
                    onClick={handleShowEndGameConfirmation}
                    className={`btn-stage group ${showWinnerChooseButton ? 'md:col-span-3' : 'md:col-span-1'}`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      END GAME
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              ) : (
                /* Question Selection Controls */
                <div className="space-y-4">
                  {customQuestionMode ? (
                    /* Custom Question Input */
                    <div>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="e.g., What song would you play at a robot wedding?"
                        className="w-full p-4 bg-vinyl-black text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all"
                        rows={2}
                      />
                      <div className="flex justify-center gap-3 mt-3">
                        <button
                          onClick={handleSubmitCustomQuestion}
                          disabled={loading || !customQuestion.trim()}
                          className="btn-gold text-sm disabled:opacity-50"
                        >
                          {loading ? 'Setting...' : 'Use This Question'}
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
                    /* Question Preview */
                    <div>
                      <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-neon-pink mb-4">
                        <p className="text-white font-bold text-lg">{nextQuestion?.text}</p>
                        <p className="text-silver text-sm mt-1">
                          <span className="bg-electric-purple/20 px-2 py-1 rounded">
                            {nextQuestion?.category}
                          </span>
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={handleSkipQuestion}
                          disabled={loading}
                          className="btn-stage text-sm disabled:opacity-50"
                        >
                          {loading ? 'Loading...' : 'Skip'}
                        </button>
                        <button
                          onClick={() => setCustomQuestionMode(true)}
                          className="btn-electric text-sm"
                        >
                          Custom
                        </button>
                        <button
                          onClick={handlePlayWithQuestion}
                          className="btn-gold text-sm col-span-2"
                        >
                          START NEXT ROUND
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowQuestionControls(false);
                      setNextQuestion(null);
                      setCustomQuestionMode(false);
                      setCustomQuestion('');
                    }}
                    className="w-full text-silver hover:text-white transition-colors text-sm"
                  >
                    ← Back to Controls
                  </button>
                </div>
              )}
              
              {error && (
                <div className="mt-4 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 text-center">
                  <span className="text-stage-red text-sm">{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Rest of the component remains the same... */}
          <div className="text-center">
            <p className="text-silver">Component continues with leaderboard and song results...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;