// Updated ResultsScreen.js - Improved UX with better hierarchy and MC focus
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
            
            {/* Compact Winner Display */}
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record mb-4">
              <div className="flex items-center justify-center">
                <div className="mr-4">
                  <VinylRecord className="w-12 h-12" animationClass="animate-vinyl-spin" />
                </div>
                <div>
                  <p className="text-gold-record font-bold text-xl">
                    {isTie ? (
                      `TIE: ${tiedPlayers?.map(p => p.displayName).join(' & ')}`
                    ) : (
                      `WINNER: ${winner?.displayName || 'Unknown'}`
                    )}
                  </p>
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

                  {/* Let Winner Choose (if not host winner) */}
                  {!isCurrentUserWinner && (
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
                    className="btn-stage group md:col-span-3"
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
                          START ROUND {(game.previousRounds?.length || 0) + 2}
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

          {/* PRIORITY 3: Compact Leaderboard (Top 3) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-rock text-turquoise">LEADERBOARD</h3>
              {sortedPlayers.length > 3 && (
                <button
                  onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                  className="text-sm text-electric-purple hover:text-neon-pink transition-colors"
                >
                  {showFullLeaderboard ? 'Show Less' : `Show All ${sortedPlayers.length}`}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {(showFullLeaderboard ? sortedPlayers : top3Players).map((player, index) => {
                const isCurrentUser = player.user._id === currentUser.id;
                const position = sortedPlayers.findIndex(p => p.user._id === player.user._id) + 1;
                
                // Calculate round points
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
                
                const getPositionStyle = () => {
                  if (position === 1) return 'from-gold-record/30 to-yellow-400/30 border-gold-record/60';
                  if (position === 2) return 'from-silver/30 to-gray-300/30 border-silver/60';
                  if (position === 3) return 'from-amber-600/30 to-orange-500/30 border-amber-600/60';
                  return 'from-stage-dark to-vinyl-black border-electric-purple/30';
                };
                
                return (
                  <div 
                    key={player.user._id}
                    className={`
                      bg-gradient-to-r ${getPositionStyle()} rounded-lg p-4 border
                      ${isCurrentUser ? 'ring-2 ring-neon-pink' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {/* Position indicator */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 ${
                          position === 1 
                            ? 'bg-gold-record text-vinyl-black' 
                            : position === 2 
                              ? 'bg-silver text-vinyl-black' 
                              : position === 3 
                                ? 'bg-amber-600 text-white' 
                                : 'bg-electric-purple text-white'
                        }`}>
                          #{position}
                        </div>
                        
                        {/* Player avatar */}
                        {player.user.profileImage && (
                          <div className="relative mr-4">
                            <img 
                              src={player.user.profileImage} 
                              alt={player.user.displayName} 
                              className="w-12 h-12 rounded-full border-2 border-silver" 
                            />
                          </div>
                        )}
                        
                        {/* Player info */}
                        <div>
                          <p className="font-bold text-white text-lg">
                            {player.user.displayName}
                            {isCurrentUser && (
                              <span className="ml-2 text-neon-pink font-medium">(YOU)</span>
                            )}
                          </p>
                          
                          <div className="flex items-center text-sm">
                            {hasPassed ? (
                              <span className="bg-deep-space/80 text-silver px-2 py-1 rounded text-xs">
                                Sat this one out
                              </span>
                            ) : roundPoints > 0 ? (
                              <div className="flex items-center">
                                <span className="text-lime-green mr-1">+{roundPoints}</span>
                                <span className="text-silver">this round</span>
                                {speedBonus > 0 && (
                                  <span className="ml-2 text-electric-purple text-xs">(includes speed bonus)</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-silver">No votes this round</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Total score */}
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          position === 1 ? 'text-gold-record' : 'text-white'
                        }`}>
                          {player.score}
                        </div>
                        <div className="text-xs text-silver">TOTAL POINTS</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRIORITY 4: Song Results - Always Visible */}
          <div className="mb-6">
            <h3 className="text-2xl font-rock text-center mb-6">
              SONGS & VOTES
            </h3>
            
            {passedSubmissions.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-deep-space/60 to-stage-dark/60 rounded-lg p-4 border border-electric-purple/30">
                <div className="flex items-center text-silver">
                  <span className="text-silver mr-2">Players who sat this one out:</span>
                  <span>
                    {passedSubmissions.map(s => s.player.displayName).join(', ')}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-6 mb-8">
              {actualSubmissions.length > 0 ? (
                  sortedSubmissions.map((submission, index) => {
                    const player = submission.player;
                    const isCurrentUserSubmission = player._id === currentUser.id;
                    const isWinner = index === 0;
                    
                    return (
                      <div 
                        key={submission._id}
                        className={`rounded-lg overflow-hidden border transition-all ${
                          isWinner 
                            ? 'bg-gradient-to-r from-gold-record/20 to-yellow-400/20 border-gold-record' 
                            : 'bg-gradient-to-r from-stage-dark to-vinyl-black border-electric-purple/30'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              {/* Ranking */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${
                                isWinner ? 'bg-gold-record text-vinyl-black' : 'bg-electric-purple text-white'
                              }`}>
                                #{index + 1}
                              </div>
                              
                              {/* Album art */}
                              {submission.albumCover && (
                                <div className="relative mr-4 flex-shrink-0">
                                  <img 
                                    src={submission.albumCover} 
                                    alt={submission.songName} 
                                    className={`w-16 h-16 rounded-lg shadow-lg ${
                                      isWinner ? 'border-3 border-gold-record' : 'border-2 border-silver'
                                    }`}
                                  />
                                  {/* Position indicator */}
                                  <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                    isWinner 
                                      ? 'bg-gold-record text-vinyl-black' 
                                      : index === 1 
                                        ? 'bg-silver text-vinyl-black' 
                                        : index === 2 
                                          ? 'bg-amber-600 text-white' 
                                          : 'bg-electric-purple text-white'
                                  }`}>
                                    #{index + 1}
                                  </div>
                                </div>
                              )}
                              
                              {/* Song info */}
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <p className="font-bold text-white text-xl">{submission.songName}</p>
                                </div>
                                
                                <p className="text-silver font-medium mb-2">{submission.artist}</p>
                                
                                <div className="flex items-center">
                                  <div className="w-6 h-6 mr-3 opacity-70">
                                    <VinylRecord className="w-6 h-6" />
                                  </div>
                                  <p className="text-sm">
                                    Chosen by: <span className="font-bold text-turquoise">{player.displayName}</span>
                                    {isCurrentUserSubmission && (
                                      <span className="ml-2 text-neon-pink font-bold">(Your Song)</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Vote display */}
                            <div className="text-center ml-6">
                              <div className={`text-4xl font-bold ${
                                isWinner ? 'text-gold-record' : 'text-white'
                              }`}>
                                {submission.votes.length}
                              </div>
                              <div className="text-xs text-silver">
                                {submission.votes.length === 1 ? 'VOTE' : 'VOTES'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Vote details - Fan reactions with speed bonus */}
                          <div className="bg-gradient-to-r from-deep-space/40 to-stage-dark/40 px-6 py-4 border-t border-electric-purple/30 mt-4">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <span className="text-silver mr-2">Voted by:</span>
                                <div className="flex flex-wrap gap-2">
                                  {submission.votes.map(voter => (
                                    <span key={voter._id} className="bg-electric-purple/30 px-2 py-1 rounded-full text-white shadow-sm">
                                      {voter.displayName}
                                      {voter._id === currentUser.id && <span className="text-neon-pink ml-1">(You)</span>}
                                      {voter._id === player._id && <span className="text-gold-record ml-1">(Self-vote)</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Speed bonus in footer, right-aligned */}
                              {submission.gotSpeedBonus && (
                                <div className="bg-gradient-to-r from-electric-purple to-neon-pink text-white rounded-full w-6 h-6 flex items-center justify-center ml-3 shadow-sm shadow-neon-pink/30">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4">
                      <VinylRecord className="w-16 h-16 mx-auto opacity-50" />
                    </div>
                    <p className="text-silver">No songs this round - everyone passed!</p>
                  </div>
                )}
              </div>
          </div>

          {/* Non-Host: Waiting Message */}
          {!isHost && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                <div className="w-16 h-16 mx-auto mb-4">
                  <VinylRecord 
                    className="w-16 h-16"
                    animationClass="animate-vinyl-spin"
                  />
                </div>
                <p className="text-silver text-lg">
                  Waiting for the MC to start the next round...
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="equalizer">
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* End Game Confirmation Modal */}
      {showEndGameConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg p-6 max-w-md w-full border border-gold-record/40 shadow-2xl">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4">
                <VinylRecord className="w-20 h-20" />
              </div>
              <h3 className="text-2xl font-rock text-gold-record mb-4">END THE GAME?</h3>
              <p className="text-silver mb-6">
                This will show final scores and winning songs from all rounds.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleCancelEndGame}
                  className="btn-stage"
                >
                  Keep Playing
                </button>
                <button 
                  onClick={handleConfirmEndGame}
                  className="btn-gold group"
                >
                  <span className="relative z-10">End Game</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;