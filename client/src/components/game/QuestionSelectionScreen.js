// client/src/components/game/QuestionSelectionScreen.js - Updated to use QuestionSelector component
import React, { useState, useEffect } from 'react';
import { setWinnerSelectedQuestion } from '../../services/gameService';
import VinylRecord from '../VinylRecord';
import QuestionSelector from './QuestionSelector';

const QuestionSelectionScreen = ({ game, currentUser, onQuestionSelected, onStartRound, onHostOverride, getWinnerInfo }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isHost = game.host._id === currentUser.id;
  
  // Get the winner's info using the provided function
  const winnerInfo = getWinnerInfo ? getWinnerInfo() : { winner: null, isTie: false, reason: 'no_winner' };
  const { winner, isTie, tiedPlayers } = winnerInfo;
  const isWinner = winner && winner._id === currentUser.id;

  // The confirmed question from the server (what both winner and host should see)
  // Only consider it confirmed if it has actual question text
  const confirmedQuestion = game.winnerSelectedQuestion && game.winnerSelectedQuestion.text 
    ? game.winnerSelectedQuestion 
    : null;

  // Sync local state when server state changes
  useEffect(() => {
    if (confirmedQuestion && confirmedQuestion.text) {
      // Question is confirmed, no need for additional state management
      setError(null);
    }
  }, [confirmedQuestion]);

  // Handle when winner confirms their question selection
  const handleWinnerQuestionSelected = async (questionData) => {
    if (!isWinner) {
      setError('Only the round winner can select the question');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to save the winner's selected question
      const result = await setWinnerSelectedQuestion(
        game._id, 
        questionData, 
        currentUser.accessToken
      );
      
      // Call the callback to notify Game.js
      if (onQuestionSelected) {
        onQuestionSelected(questionData);
      }
      
    } catch (error) {
      setError(`Failed to confirm question: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
            NEXT QUESTION
          </h2>
          <p className="text-silver text-center mt-2">
            {winner?.displayName} won the last round and gets to pick the next question!
          </p>
        </div>

        <div className="p-6">
          
          {/* Winner Display / Host Controls Panel - Transforms based on state */}
          <div className="text-center mb-8">
            {confirmedQuestion && isHost ? (
              /* Host Controls Panel - Replaces winner display once question is confirmed */
              <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 rounded-lg p-6 border border-electric-purple/40">
                <h3 className="text-xl font-rock text-electric-purple mb-4">
                  MC CONTROLS
                </h3>
                <div className="space-y-4">
                  {/* Start Round Button */}
                  <div>
                    <button
                      onClick={() => {
                        if (typeof onStartRound === 'function') {
                          onStartRound(confirmedQuestion);
                        }
                      }}
                      className="btn-gold text-lg px-8 py-3"
                    >
                      START NEXT ROUND
                    </button>
                    <p className="text-xs text-silver mt-2">
                      Begin the round with {winner?.displayName}'s selected question
                    </p>
                  </div>
                  
                  {/* Host Override Button */}
                  <div>
                    <button
                      onClick={onHostOverride}
                      className="btn-stage"
                    >
                      HOST OVERRIDE - CHOOSE DIFFERENT QUESTION
                    </button>
                    <p className="text-xs text-silver mt-2">
                      Skip this selection and choose the question yourself
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Winner Display Panel - Shows until question is confirmed */
              <div className="bg-gradient-to-r from-gold-record/20 to-yellow-400/20 rounded-lg p-6 border border-gold-record/40">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <VinylRecord 
                      className="w-16 h-16"
                      animationClass="animate-vinyl-spin"
                    />
                  </div>
                </div>
                <h3 className="text-xl font-rock text-gold-record mb-2">
                  ROUND WINNER: {winner?.displayName}
                  {isWinner && <span className="text-neon-pink ml-2">(You!)</span>}
                </h3>
                {isTie && tiedPlayers && (
                  <p className="text-silver text-sm mb-2">
                    Tied with: {tiedPlayers.filter(p => p._id !== winner._id).map(p => p.displayName).join(', ')}
                  </p>
                )}
                <p className="text-silver text-sm">
                  {confirmedQuestion 
                    ? "Has selected the next question!" 
                    : "Gets to choose the next question"}
                </p>
                {/* Show host override option if host and no question confirmed yet */}
                {isHost && !confirmedQuestion && (
                  <div className="mt-4 pt-4 border-t border-gold-record/30">
                    <button
                      onClick={onHostOverride}
                      className="btn-stage text-sm"
                    >
                      HOST OVERRIDE - CHOOSE QUESTION YOURSELF
                    </button>
                    <p className="text-xs text-silver mt-2">
                      Skip winner selection and choose the question yourself
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WINNER'S CONFIRMED QUESTION - Prominently displayed for everyone */}
          {confirmedQuestion && (
            <div className="mb-8 bg-gradient-to-r from-lime-green/10 to-green-600/10 rounded-lg p-6 border border-lime-green/40">
              <h4 className="text-lg font-rock text-lime-green mb-4 text-center">✓ SELECTED QUESTION</h4>
              <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border border-lime-green/30">
                <p className="text-2xl font-bold text-white mb-3 text-center">{confirmedQuestion.text}</p>
                <p className="text-center text-silver">
                  <span className="bg-electric-purple/20 px-3 py-2 rounded-lg">
                    {confirmedQuestion.category}
                  </span>
                </p>
              </div>
              <p className="text-center text-silver text-sm mt-4">
                Selected by {winner?.displayName} • Ready to start the next round
              </p>
            </div>
          )}

          {isWinner ? (
            /* Winner Controls */
            <div className="space-y-6">
              
              {confirmedQuestion ? (
                /* Question Already Confirmed */
                <div className="bg-gradient-to-r from-lime-green/10 to-green-600/10 rounded-lg p-6 border border-lime-green/40">
                  <h4 className="text-lg font-rock text-lime-green mb-3 text-center">✓ QUESTION CONFIRMED</h4>
                  <p className="text-center text-silver text-sm mt-4">
                    Waiting for the host to start the next round...
                  </p>
                </div>
              ) : (
                /* Question Selection using QuestionSelector component - Auto-loads immediately */
                <QuestionSelector
                  gameId={game._id}
                  accessToken={currentUser.accessToken}
                  onQuestionSelected={handleWinnerQuestionSelected}
                  onCancel={null} // No back button for winner - they must choose
                  autoLoad={true} // Automatically load a question when component mounts
                  confirmButtonText="CONFIRM THIS QUESTION"
                  title="CHOOSE THE NEXT QUESTION"
                  showBackButton={false} // Winner can't go back - they must choose
                />
              )}
              
              {error && (
                <div className="bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 text-center">
                  <span className="text-stage-red">{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* Non-Winner View */
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-8 border border-electric-purple/30">
                <div className="mb-6">
                  <VinylRecord 
                    className="w-20 h-20 mx-auto"
                    animationClass="animate-vinyl-spin"
                  />
                </div>
                
                <h3 className="text-xl font-rock text-electric-purple mb-4">
                  WAITING FOR QUESTION SELECTION
                </h3>
                
                <p className="text-silver mb-4">
                  {winner?.displayName} is choosing the next question...
                </p>
                
                {!confirmedQuestion && (
                  <p className="text-silver text-sm">
                    Waiting for {winner?.displayName} to make their choice...
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionScreen;