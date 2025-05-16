// client/src/components/game/ResultsScreen.js - Rockstar Design Edition
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
    <div className="max-w-4xl mx-auto">
      {/* Main stage card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* Stage header - Concert finale */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
            🏆 SET RESULTS 🏆
          </h2>
          
          <div className="text-center mt-4">
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record">
              <p className="text-gold-record font-bold text-xl">{game.currentQuestion.text}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          
          {/* Small game notice */}
          {isSmallGame && (
            <div className="mb-6 bg-gradient-to-r from-turquoise/10 to-lime-green/10 rounded-lg p-4 border border-turquoise/30">
              <div className="flex items-center text-turquoise">
                <span className="mr-2">ℹ️</span>
                <span className="font-medium">
                  <strong>Note:</strong> In intimate concerts (fewer than 3 musicians), you can vote for your own performance.
                </span>
              </div>
            </div>
          )}
          
          {/* Pass Information */}
          {passedSubmissions.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-electric-purple/20">
              <div className="flex items-center text-silver">
                <span className="mr-2">🎭</span>
                <span>
                  <strong>Musicians who sat this one out:</strong> {passedSubmissions.map(s => s.player.displayName).join(', ')}
                </span>
              </div>
            </div>
          )}
          
          {/* Results section - Album collection style */}
          {actualSubmissions.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-2xl font-rock text-center mb-6 flex items-center justify-center">
                <span className="mr-3">🎵</span>
                SONGS & CROWD RESPONSE
                <span className="ml-3">🎵</span>
              </h3>
              
              <div className="space-y-6">
                {sortedSubmissions.map((submission, index) => {
                  const player = submission.player;
                  const isCurrentUserSubmission = player._id === currentUser.id;
                  const isWinner = index === 0;
                  
                  return (
                    <div 
                      key={submission._id}
                      className={`relative rounded-lg overflow-hidden transition-all ${
                        isWinner 
                          ? 'bg-gradient-to-r from-gold-record/20 to-yellow-400/20 border-2 border-gold-record shadow-lg shadow-gold-record/30' 
                          : 'bg-gradient-to-r from-stage-dark to-vinyl-black border border-electric-purple/30'
                      }`}
                    >
                      {/* Winner crown decoration */}
                      {isWinner && (
                        <div className="absolute -top-4 left-6 z-10">
                          <div className="bg-gold-record rounded-full p-3 shadow-lg animate-pulse">
                            <span className="text-vinyl-black text-2xl">👑</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center p-6">
                        {/* Album art */}
                        {submission.albumCover && (
                          <div className="relative mr-6 flex-shrink-0">
                            <img 
                              src={submission.albumCover} 
                              alt={submission.songName} 
                              className={`w-20 h-20 rounded-lg shadow-lg ${
                                isWinner ? 'border-3 border-gold-record' : 'border-2 border-silver'
                              }`}
                            />
                            {/* Position indicator */}
                            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
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
                            {isWinner && (
                              <div className="ml-3 bg-gradient-to-r from-gold-record to-yellow-400 text-vinyl-black text-sm px-3 py-1 rounded-full font-bold flex items-center animate-pulse">
                                <span className="mr-1">🏆</span>
                                CROWD FAVORITE!
                              </div>
                            )}
                            {submission.gotSpeedBonus && (
                              <div className="ml-3 bg-gradient-to-r from-electric-purple to-neon-pink text-white text-sm px-3 py-1 rounded-full font-bold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                                SPEED BONUS (+1)
                              </div>
                            )}
                          </div>
                          
                          <p className="text-silver font-medium mb-2">{submission.artist}</p>
                          
                          <div className="flex items-center">
                            <div className="vinyl-record w-6 h-6 mr-3 opacity-70">
                              <div className="absolute inset-0 flex items-center justify-center text-xs">♪</div>
                            </div>
                            <p className="text-sm">
                              Performed by: <span className="font-bold text-turquoise">{player.displayName}</span>
                              {isCurrentUserSubmission && (
                                <span className="ml-2 text-neon-pink font-bold">(Your Performance)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Vote display - Concert crowd style */}
                        <div className="text-center ml-6">
                          <div className={`text-4xl font-bold ${
                            isWinner ? 'text-gold-record' : 'text-white'
                          }`}>
                            {submission.votes.length}
                          </div>
                          <div className="text-xs text-silver">
                            CROWD {submission.votes.length === 1 ? 'VOTE' : 'VOTES'}
                          </div>
                          
                          {/* Crowd enthusiasm indicator */}
                          <div className="mt-2 flex justify-center">
                            {[...Array(Math.min(submission.votes.length, 5))].map((_, i) => (
                              <span key={i} className="text-yellow-500 animate-bounce" style={{animationDelay: `${i * 0.1}s`}}>
                                🔥
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Vote details - Fan reactions */}
                      {submission.votes.length > 0 && (
                        <div className="bg-gradient-to-r from-deep-space/30 to-stage-dark/30 px-6 py-4 border-t border-electric-purple/20">
                          <div className="flex items-center text-sm">
                            <span className="text-silver mr-2">🎤 Fan reactions from:</span>
                            <div className="flex flex-wrap gap-2">
                              {submission.votes.map(voter => (
                                <span key={voter._id} className="bg-electric-purple/20 px-2 py-1 rounded-full text-white">
                                  {voter.displayName}
                                  {voter._id === currentUser.id && <span className="text-neon-pink ml-1">(You)</span>}
                                  {voter._id === player._id && <span className="text-gold-record ml-1">(Self-vote)</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No submissions message */
            <div className="mb-8 text-center py-12">
              <div className="vinyl-record w-24 h-24 mx-auto mb-6 opacity-50">
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🎭</div>
              </div>
              <h3 className="text-xl font-rock text-silver mb-2">SILENT STAGE</h3>
              <p className="text-silver">No performances this round.</p>
              <p className="text-silver/60 text-sm">All musicians sat this question out.</p>
            </div>
          )}
          
          {/* Scoreboard - Leaderboard style */}
          <div className="mb-8">
            <h3 className="text-2xl font-rock text-center mb-6 flex items-center justify-center">
              <span className="mr-3">🏅</span>
              BAND RANKINGS
              <span className="ml-3">🏅</span>
            </h3>
            
            <div className="space-y-3">
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
                  const isLeader = index === 0;
                  
                  return (
                    <div 
                      key={player.user._id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                        isLeader 
                          ? 'bg-gradient-to-r from-gold-record/20 to-yellow-400/20 border border-gold-record/50' 
                          : 'bg-gradient-to-r from-stage-dark to-vinyl-black border border-electric-purple/30'
                      } ${
                        player.user._id === currentUser.id ? 'ring-2 ring-neon-pink' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        {/* Position indicator */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 ${
                          isLeader 
                            ? 'bg-gold-record text-vinyl-black' 
                            : index === 1 
                              ? 'bg-silver text-vinyl-black' 
                              : index === 2 
                                ? 'bg-amber-600 text-white' 
                                : 'bg-electric-purple text-white'
                        }`}>
                          {isLeader ? '👑' : `#${index + 1}`}
                        </div>
                        
                        {/* Player avatar */}
                        {player.user.profileImage && (
                          <div className="relative mr-4">
                            <img 
                              src={player.user.profileImage} 
                              alt={player.user.displayName} 
                              className="w-12 h-12 rounded-full border-2 border-silver" 
                            />
                            {isLeader && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold-record rounded-full flex items-center justify-center">
                                <span className="text-xs">✨</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Player info */}
                        <div>
                          <p className="font-bold text-white text-lg">
                            {player.user.displayName}
                            {player.user._id === currentUser.id && (
                              <span className="ml-2 text-neon-pink font-medium">(You)</span>
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
                                <span className="text-silver">this set</span>
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
                          isLeader ? 'text-gold-record' : 'text-white'
                        }`}>
                          {player.score}
                        </div>
                        <div className="text-xs text-silver">TOTAL POINTS</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Next Round Section - Encore controls */}
          {isHost && (
            <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
              <h3 className="text-xl font-rock text-center mb-6 text-gold-record">
                🎛️ BANDLEADER CONTROLS 🎛️
              </h3>
              
              {!showQuestionPreview ? (
                <div className="text-center">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={handleShowNextQuestion}
                      disabled={loading}
                      className="btn-electric disabled:opacity-50 group"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {loading ? (
                          <>
                            <div className="vinyl-record w-5 h-5 animate-spin mr-3"></div>
                            LOADING...
                          </>
                        ) : (
                          <>
                            <span className="mr-3">🎸</span>
                            ENCORE PERFORMANCE
                            <span className="ml-3">🎸</span>
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                    
                    <button
                      onClick={handleShowEndGameConfirmation}
                      className="btn-stage group"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        <span className="mr-3">🎭</span>
                        END CONCERT
                        <span className="ml-3">🎭</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </div>
                  
                  <p className="text-silver text-sm mt-4">
                    Choose to continue the show or wrap up with a final celebration
                  </p>
                </div>
              ) : (
                /* Question preview - Setlist selection */
                <div className="space-y-6">
                  <h4 className="text-lg font-rock text-neon-pink text-center">🎵 NEXT SONG PREVIEW 🎵</h4>
                  
                  {customQuestionMode ? (
                    /* Custom question input */
                    <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border border-electric-purple/30">
                      <label className="block text-silver text-sm font-medium mb-3">
                        ✏️ Write Your Own Musical Challenge
                      </label>
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="e.g., What song would you play at a robot wedding?"
                        className="w-full p-4 bg-deep-space text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all"
                        rows={3}
                      />
                      <div className="flex justify-center gap-3 mt-4">
                        <button
                          onClick={handleSubmitCustomQuestion}
                          disabled={loading || !customQuestion.trim()}
                          className="btn-gold text-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="vinyl-record w-4 h-4 animate-spin mr-2 inline-block"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">💾</span>
                              Set Question
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
                    /* Generated question preview */
                    <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border border-neon-pink/40">
                      <div className="flex items-start">
                        <div className="text-4xl mr-4">🎭</div>
                        <div className="flex-1">
                          <p className="text-neon-pink font-bold text-xl mb-2">{nextQuestion?.text}</p>
                          <p className="text-silver">
                            <span className="bg-electric-purple/20 px-2 py-1 rounded">
                              {nextQuestion?.category}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-3 mt-6">
                        <button
                          onClick={handlePlayWithQuestion}
                          className="btn-gold group"
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            <span className="mr-2">🚀</span>
                            ROCK THIS SONG
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        </button>
                        
                        <button
                          onClick={handleSkipQuestion}
                          disabled={loading}
                          className="btn-electric text-sm disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="vinyl-record w-4 h-4 animate-spin mr-2 inline-block"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">🔄</span>
                              Try Another
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => setCustomQuestionMode(true)}
                          className="btn-stage text-sm"
                        >
                          <span className="mr-2">✏️</span>
                          Write Custom
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 text-center">
                      <span className="text-stage-red">{error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Waiting message for non-hosts */}
          {!isHost && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                <div className="vinyl-record w-16 h-16 mx-auto mb-4 animate-vinyl-spin">
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🎪</div>
                </div>
                <p className="text-silver text-lg">
                  Waiting for the bandleader to decide what's next...
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
        
        {/* Stage footer */}
        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 p-4 border-t border-electric-purple/20">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 text-silver/60">
              <span className="animate-bounce">♪</span>
              <span className="text-xs font-medium">Round complete • Crowd loved it!</span>
              <span className="animate-bounce" style={{animationDelay: '0.5s'}}>♫</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* End Game Confirmation Modal */}
      {showEndGameConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg p-6 max-w-md w-full border border-gold-record/40 shadow-2xl">
            <div className="text-center">
              <div className="vinyl-record w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🎭</div>
              </div>
              <h3 className="text-2xl font-rock text-gold-record mb-4">END THE CONCERT?</h3>
              <p className="text-silver mb-6">
                Are you sure you want to wrap up the show? This will reveal the final scores and winning songs from all sets.
              </p>
              <div className="bg-electric-purple/10 rounded-lg p-3 mb-6 border border-electric-purple/30">
                <p className="text-electric-purple text-sm">
                  🎸 Everyone will get to see their greatest hits and the ultimate champion!
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleCancelEndGame}
                  className="btn-stage"
                >
                  Keep Rocking
                </button>
                <button 
                  onClick={handleConfirmEndGame}
                  className="btn-gold group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    🏁 Final Bow
                  </span>
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