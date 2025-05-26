// client/src/components/game/ResultsScreen.js - Refactored to use QuestionSelector
import React, { useState } from 'react';
import VinylRecord from '../VinylRecord';
import QuestionSelector from './QuestionSelector';

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
  
  // Question selection states - simplified to just track mode
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [showEndGameConfirmation, setShowEndGameConfirmation] = useState(false);
  
  // Progressive disclosure states
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  // Handle showing the question selector
  const handleShowQuestionSelector = () => {
    setShowQuestionSelector(true);
  };
  
  // Handle question selection from QuestionSelector component
  const handleQuestionSelected = (question) => {
    setShowQuestionSelector(false);
    onNextRound(question);
  };

  // Handle going back from question selector
  const handleBackFromQuestionSelector = () => {
    setShowQuestionSelector(false);
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
            
            {/* Winner Display */}
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
              
              {!showQuestionSelector ? (
                /* Main Controls */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quick Next Round with Question Selector */}
                  <button
                    onClick={handleShowQuestionSelector}
                    className="btn-electric group col-span-1 md:col-span-2"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      START NEXT ROUND
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>

                  {/* Only show "Let Winner Choose" if there's actually a winner */}
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
                /* Question Selection using shared QuestionSelector component */
                <QuestionSelector
                  gameId={game._id}
                  accessToken={currentUser.accessToken}
                  onQuestionSelected={handleQuestionSelected}
                  onCancel={handleBackFromQuestionSelector}
                  autoLoad={true}
                  confirmButtonText="START NEXT ROUND"
                  title="CHOOSE NEXT QUESTION"
                  showBackButton={true}
                />
              )}
            </div>
          )}

          {/* PRIORITY 3: Compact Leaderboard */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border border-electric-purple/30">
              <h3 className="text-xl font-rock text-center mb-6 text-turquoise">
                CURRENT STANDINGS
              </h3>
              
              <div className="space-y-3">
                {top3Players.map((player, index) => {
                  const position = index + 1;
                  const isCurrentUser = player.user._id === currentUser.id;
                  
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
                        bg-gradient-to-r ${getPositionStyle()} rounded-lg p-4 border transition-all
                        ${isCurrentUser ? 'ring-2 ring-neon-pink shadow-neon-pink/30' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-4
                            ${position === 1 ? 'bg-gold-record text-vinyl-black' : 
                              position === 2 ? 'bg-silver text-vinyl-black' : 
                              position === 3 ? 'bg-amber-600 text-white' : 
                              'bg-electric-purple text-white'}
                          `}>
                            {position}
                          </div>
                          
                          <div>
                            <p className="font-bold text-white font-rock">
                              {player.user.displayName}
                              {isCurrentUser && (
                                <span className="ml-2 text-neon-pink font-medium">(YOU)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-2xl font-bold font-rock ${
                            position === 1 ? 'text-gold-record' : 
                            position === 2 ? 'text-silver' : 
                            position === 3 ? 'text-amber-600' : 
                            'text-white'
                          }`}>
                            {player.score}
                          </div>
                          <div className="text-xs text-silver uppercase tracking-wider">POINTS</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {game.players.length > 3 && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
                    className="text-turquoise hover:text-lime-green transition-colors text-sm font-medium"
                  >
                    {showFullLeaderboard ? 'Show Less' : `Show All ${game.players.length} Players`}
                  </button>
                </div>
              )}
              
              {/* Full leaderboard when expanded */}
              {showFullLeaderboard && (
                <div className="mt-4 pt-4 border-t border-electric-purple/30 space-y-2">
                  {sortedPlayers.slice(3).map((player, index) => {
                    const position = index + 4;
                    const isCurrentUser = player.user._id === currentUser.id;
                    
                    return (
                      <div 
                        key={player.user._id}
                        className={`
                          bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-3 border border-electric-purple/30
                          ${isCurrentUser ? 'ring-1 ring-neon-pink' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-electric-purple text-white mr-3 text-sm">
                              {position}
                            </div>
                            <p className="text-white font-medium">
                              {player.user.displayName}
                              {isCurrentUser && (
                                <span className="ml-2 text-neon-pink text-sm">(YOU)</span>
                              )}
                            </p>
                          </div>
                          <div className="text-white font-bold">
                            {player.score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PRIORITY 4: Round Results */}
          <div className="mb-8">
            <h3 className="text-xl font-rock text-center mb-6 text-neon-pink">
              THIS ROUND'S SONGS
            </h3>
            
            {actualSubmissions.length === 0 ? (
              /* No submissions */
              <div className="text-center py-8">
                <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-8 border border-silver/20">
                  <div className="mb-4">
                    <VinylRecord 
                      className="w-16 h-16 mx-auto opacity-50"
                      animationClass=""
                    />
                  </div>
                  <h4 className="text-lg font-rock text-silver mb-2">SILENT STAGE</h4>
                  <p className="text-silver">All players passed on this question</p>
                  {passedSubmissions.length > 0 && (
                    <p className="text-silver/60 text-sm mt-2">
                      {passedSubmissions.length} player{passedSubmissions.length !== 1 ? 's' : ''} passed
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Show submissions */
              <div className="space-y-4">
                {sortedSubmissions.map((submission, index) => {
                  const isWinning = index === 0;
                  const votes = submission.votes?.length || 0;
                  
                  return (
                    <div 
                      key={submission._id}
                      className={`
                        bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-4 border
                        ${isWinning ? 'border-gold-record shadow-gold-record/20' : 'border-electric-purple/30'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          {/* Position indicator for winner */}
                          {isWinning && (
                            <div className="w-10 h-10 rounded-full bg-gold-record text-vinyl-black flex items-center justify-center font-bold text-lg mr-4">
                              1
                            </div>
                          )}
                          
                          {/* Album cover */}
                          {submission.albumCover && (
                            <div className="relative mr-4 flex-shrink-0">
                              <img 
                                src={submission.albumCover} 
                                alt={submission.songName} 
                                className={`w-12 h-12 rounded-lg border-2 ${
                                  isWinning ? 'border-gold-record' : 'border-silver'
                                }`}
                              />
                            </div>
                          )}
                          
                          {/* Song info */}
                          <div className="flex-1">
                            <p className="font-bold text-white text-lg">{submission.songName}</p>
                            <p className="text-silver">{submission.artist}</p>
                            <p className="text-turquoise text-sm">
                              by {submission.player?.displayName || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Vote count */}
                        <div className="text-right ml-4">
                          <div className={`text-2xl font-bold ${
                            isWinning ? 'text-gold-record' : 'text-white'
                          }`}>
                            {votes}
                          </div>
                          <div className="text-silver text-sm">
                            vote{votes !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Show voters if any */}
                      {submission.votes && submission.votes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-electric-purple/20">
                          <div className="flex flex-wrap gap-2">
                            {submission.votes.map((voter) => (
                              <span 
                                key={voter._id}
                                className="bg-gradient-to-r from-vinyl-black to-stage-dark px-2 py-1 rounded text-sm border border-electric-purple/30"
                              >
                                {voter.displayName}
                                {voter._id === currentUser.id && (
                                  <span className="text-neon-pink ml-1">(YOU)</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Show passed submissions count if any */}
                {passedSubmissions.length > 0 && (
                  <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-silver/20 text-center">
                    <p className="text-silver">
                      {passedSubmissions.length} player{passedSubmissions.length !== 1 ? 's' : ''} passed on this question
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Non-host message */}
          {!isHost && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                <div className="mb-4">
                  <VinylRecord 
                    className="w-12 h-12 mx-auto"
                    animationClass="animate-vinyl-spin"
                  />
                </div>
                <h3 className="text-lg font-rock text-electric-purple mb-2">
                  WAITING FOR THE MC
                </h3>
                <p className="text-silver">
                  The host is deciding what happens next...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End Game Confirmation Modal */}
      {showEndGameConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg p-6 max-w-md w-full border border-stage-red/40 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-rock text-stage-red mb-4">END THE GAME?</h3>
              <p className="text-silver mb-6">
                This will finish the game and show final results to all players.
              </p>
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleCancelEndGame}
                  className="btn-stage px-6"
                >
                  Keep Playing
                </button>
                <button 
                  onClick={handleConfirmEndGame}
                  className="btn-electric px-6 bg-gradient-to-r from-stage-red to-red-600"
                >
                  End Game
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