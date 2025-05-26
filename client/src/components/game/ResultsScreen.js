// client/src/components/game/ResultsScreen.js - Updated with Action Management
import React, { useState } from 'react';
import { useGameStateActions } from '../../hooks/useGameStateActions';
import VinylRecord from '../VinylRecord';
import QuestionSelector from './QuestionSelector';
import ActionButton from '../ActionButton';
import ActionError from '../ActionError';

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
  
  // Leaderboard state - compact by default, expandable
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  // Use the game state actions hook
  const { actions, isPending, getError, clearError } = useGameStateActions(game._id);
  
  // Handle showing the question selector
  const handleShowQuestionSelector = () => {
    setShowQuestionSelector(true);
  };
  
  // Handle question selection from QuestionSelector component - with action management
  const handleQuestionSelected = async (question) => {
    try {
      setShowQuestionSelector(false);
      await actions.startNewRound(question);
      // Game state will be updated via polling in Game.js
    } catch (error) {
      console.error('Failed to start new round:', error);
      // Error is handled by the action system
    }
  };

  // Handle going back from question selector
  const handleBackFromQuestionSelector = () => {
    setShowQuestionSelector(false);
  };
  
  // Handle move to question selection - with action management
  const handleMoveToQuestionSelection = async () => {
    try {
      await actions.moveToQuestionSelection();
      // Game state will be updated via polling in Game.js
    } catch (error) {
      console.error('Failed to move to question selection:', error);
      // Error is handled by the action system
    }
  };
  
  // End game functions - with action management
  const handleShowEndGameConfirmation = () => setShowEndGameConfirmation(true);
  const handleConfirmEndGame = async () => {
    try {
      await actions.endGame();
      setShowEndGameConfirmation(false);
      // Game state will be updated via polling in Game.js
    } catch (error) {
      console.error('Failed to end game:', error);
      // Error is handled by the action system
    }
  };
  const handleCancelEndGame = () => setShowEndGameConfirmation(false);

  // Get sorted players for leaderboard
  const sortedPlayers = game.players
    .slice()
    .sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main stage card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* PRIORITY 1: Winner Announcement + Question */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-4">
            ROUND COMPLETE
          </h2>
          
          {/* Current Question */}
          <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-electric-purple/30 mb-4">
            <p className="text-neon-pink font-medium text-lg text-center">{game.currentQuestion.text}</p>
          </div>

          {/* Winner Display - Compact */}
          <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record">
            <div className="flex items-center justify-center">
              <VinylRecord className="w-8 h-8 mr-3" animationClass="animate-vinyl-spin" />
              <div className="text-center">
                {reason === 'all_passed' || actualSubmissions.length === 0 ? (
                  <p className="text-silver font-bold text-lg">NO WINNER - ALL PLAYERS PASSED</p>
                ) : isTie ? (
                  <p className="text-gold-record font-bold text-lg">
                    TIE: {tiedPlayers?.map(p => p.displayName).join(' & ')}
                  </p>
                ) : winner ? (
                  <p className="text-gold-record font-bold text-lg">
                    WINNER: {winner.displayName || 'Unknown'}
                  </p>
                ) : (
                  <p className="text-silver font-bold text-lg">NO WINNER</p>
                )}
                
                {/* Show winning song only if there were actual submissions */}
                {sortedSubmissions[0] && !sortedSubmissions[0].hasPassed && (
                  <p className="text-silver text-sm mt-1">
                    "{sortedSubmissions[0].songName}" by {sortedSubmissions[0].artist}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          
          {/* Action Errors */}
          <ActionError 
            error={getError('startNewRound') || getError('endGame') || getError('moveToQuestionSelection')} 
            onDismiss={() => {
              clearError('startNewRound');
              clearError('endGame');
              clearError('moveToQuestionSelection');
            }}
            className="mb-6"
          />
          
          {/* PRIORITY 2: MC Controls (Always Visible for Host) */}
          {isHost && (
            <div className="mb-6 bg-gradient-to-r from-deep-space/60 to-stage-dark/60 rounded-lg p-4 border border-gold-record/40">
              <h3 className="text-lg font-rock text-center mb-4 text-gold-record">MC CONTROLS</h3>
              
              {!showQuestionSelector ? (
                /* Main Controls - More compact */
                <div className="flex flex-wrap justify-center gap-3">
                  <ActionButton
                    onClick={handleShowQuestionSelector}
                    isLoading={isPending('startNewRound')}
                    className="btn-electric px-6 py-2"
                  >
                    START NEXT ROUND
                  </ActionButton>

                  {showWinnerChooseButton && (
                    <ActionButton
                      onClick={handleMoveToQuestionSelection}
                      isLoading={isPending('moveToQuestionSelection')}
                      className="btn-gold px-4 py-2"
                    >
                      WINNER CHOOSES
                    </ActionButton>
                  )}

                  <ActionButton
                    onClick={handleShowEndGameConfirmation}
                    className="btn-stage px-4 py-2"
                  >
                    END GAME
                  </ActionButton>
                </div>
              ) : (
                /* Question Selection */
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

          {/* PRIORITY 3: Round Results - Now above leaderboard */}
          <div className="mb-6">
            <h3 className="text-xl font-rock text-center mb-4 text-neon-pink">THIS ROUND'S SONGS</h3>
            
            {actualSubmissions.length === 0 ? (
              /* No submissions - Much more compact */
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-silver/20 text-center">
                <VinylRecord className="w-12 h-12 mx-auto opacity-50 mb-3" animationClass="" />
                <h4 className="text-lg font-rock text-silver mb-1">SILENT STAGE</h4>
                <p className="text-silver text-sm">All players passed on this question</p>
              </div>
            ) : (
              /* Show submissions - More compact format */
              <div className="space-y-3">
                {sortedSubmissions.map((submission, index) => {
                  const isWinning = index === 0;
                  const votes = submission.votes?.length || 0;
                  
                  return (
                    <div 
                      key={submission._id}
                      className={`
                        bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg p-3 border
                        ${isWinning ? 'border-gold-record shadow-gold-record/20' : 'border-electric-purple/30'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          {/* Position + Album cover combined */}
                          <div className="relative mr-3 flex-shrink-0">
                            {submission.albumCover ? (
                              <div className="relative">
                                <img 
                                  src={submission.albumCover} 
                                  alt={submission.songName} 
                                  className={`w-10 h-10 rounded-lg border-2 ${
                                    isWinning ? 'border-gold-record' : 'border-silver'
                                  }`}
                                />
                                {isWinning && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-record text-vinyl-black flex items-center justify-center text-xs font-bold">
                                    1
                                  </div>
                                )}
                              </div>
                            ) : (
                              isWinning && (
                                <div className="w-10 h-10 rounded-full bg-gold-record text-vinyl-black flex items-center justify-center font-bold">
                                  1
                                </div>
                              )
                            )}
                          </div>
                          
                          {/* Song info - More compact */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{submission.songName}</p>
                            <p className="text-silver text-sm truncate">{submission.artist}</p>
                            <p className="text-turquoise text-xs">
                              by {submission.player?.displayName || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Vote count */}
                        <div className="text-right ml-3">
                          <div className={`text-xl font-bold ${
                            isWinning ? 'text-gold-record' : 'text-white'
                          }`}>
                            {votes}
                          </div>
                          <div className="text-silver text-xs">
                            vote{votes !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Show voters - Compact */}
                      {submission.votes && submission.votes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-electric-purple/20">
                          <div className="flex flex-wrap gap-1">
                            {submission.votes.map((voter) => (
                              <span 
                                key={voter._id}
                                className="bg-gradient-to-r from-vinyl-black to-stage-dark px-2 py-0.5 rounded text-xs border border-electric-purple/20"
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
                  <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-2 border border-silver/20 text-center">
                    <p className="text-silver text-sm">
                      {passedSubmissions.length} player{passedSubmissions.length !== 1 ? 's' : ''} passed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PRIORITY 4: Compact Leaderboard - Table-like format */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg border border-electric-purple/30 overflow-hidden">
              
              {/* Header with expand/collapse */}
              <div 
                className="p-3 border-b border-electric-purple/30 cursor-pointer hover:bg-electric-purple/10 transition-all"
                onClick={() => setShowFullLeaderboard(!showFullLeaderboard)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-rock text-turquoise">CURRENT STANDINGS</h3>
                  <div className="flex items-center text-silver">
                    <span className="text-sm mr-2">
                      {showFullLeaderboard ? 'Hide' : 'Show All'}
                    </span>
                    <svg 
                      className={`w-4 h-4 transform transition-transform ${showFullLeaderboard ? 'rotate-180' : ''}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Table-like leaderboard */}
              <div className="divide-y divide-electric-purple/20">
                {(showFullLeaderboard ? sortedPlayers : sortedPlayers.slice(0, 3)).map((player, index) => {
                  const position = index + 1;
                  const isCurrentUser = player.user._id === currentUser.id;
                  
                  const getPositionColor = () => {
                    if (position === 1) return 'text-gold-record';
                    if (position === 2) return 'text-silver';
                    if (position === 3) return 'text-amber-600';
                    return 'text-white';
                  };
                  
                  return (
                    <div 
                      key={player.user._id}
                      className={`
                        flex items-center justify-between p-3 hover:bg-electric-purple/5 transition-all
                        ${isCurrentUser ? 'bg-neon-pink/10 border-l-2 border-neon-pink' : ''}
                      `}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {/* Position */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0 ${
                          position === 1 ? 'bg-gold-record text-vinyl-black' : 
                          position === 2 ? 'bg-silver text-vinyl-black' : 
                          position === 3 ? 'bg-amber-600 text-white' : 
                          'bg-electric-purple text-white'
                        }`}>
                          {position}
                        </div>
                        
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold truncate ${getPositionColor()}`}>
                            {player.user.displayName}
                            {isCurrentUser && (
                              <span className="ml-2 text-neon-pink font-medium text-sm">(YOU)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="text-right ml-3">
                        <div className={`text-lg font-bold ${getPositionColor()}`}>
                          {player.score}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Show count when collapsed */}
              {!showFullLeaderboard && game.players.length > 3 && (
                <div className="p-2 text-center border-t border-electric-purple/30">
                  <span className="text-silver text-xs">
                    +{game.players.length - 3} more players
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Non-host message - More compact */}
          {!isHost && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-electric-purple/30">
                <VinylRecord className="w-8 h-8 mx-auto mb-2" animationClass="animate-vinyl-spin" />
                <h3 className="text-lg font-rock text-electric-purple mb-1">WAITING FOR THE MC</h3>
                <p className="text-silver text-sm">The host is deciding what happens next...</p>
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
              
              {/* Action Error in confirmation dialog */}
              <ActionError 
                error={getError('endGame')} 
                onDismiss={() => clearError('endGame')}
                className="mb-4"
              />
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={handleCancelEndGame}
                  className="btn-stage px-6"
                >
                  Keep Playing
                </button>
                <ActionButton 
                  onClick={handleConfirmEndGame}
                  isLoading={isPending('endGame')}
                  loadingText="Ending..."
                  className="btn-electric px-6 bg-gradient-to-r from-stage-red to-red-600"
                >
                  End Game
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsScreen;