// client/src/components/game/QuestionSelectionScreen.js - FIXED
import React, { useState, useEffect } from 'react';
import { useGameStateActions } from '../../hooks/useGameStateActions';
import VinylRecord from '../VinylRecord';
import QuestionSelector from './QuestionSelector';
import ActionButton from '../ActionButton';
import ActionError from '../ActionError';

const QuestionSelectionScreen = ({ game, currentUser, onQuestionSelected, onStartRound, onHostOverride, getWinnerInfo }) => {
  // Use the game state actions hook
  const { actions, isPending, getError, clearError } = useGameStateActions(game._id);

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
      // Question is confirmed, clear any errors
      clearError('setWinnerSelectedQuestion');
    }
  }, [confirmedQuestion, clearError]);

  // Handle when winner confirms their question selection - with action management
  const handleWinnerQuestionSelected = async (questionData) => {
    if (!isWinner) {
      return;
    }
    
    try {
      await actions.setWinnerSelectedQuestion(questionData);
      
      // Call the callback to notify Game.js
      if (onQuestionSelected) {
        onQuestionSelected(questionData);
      }
      
    } catch (error) {
      console.error('Failed to confirm question:', error);
      // Error is handled by the action system
    }
  };

  // FIXED: Handle start round with correct data structure
  const handleStartRound = async () => {
      if (!isHost || !confirmedQuestion) {
        console.warn('🚫 handleStartRound: Preconditions not met', {
        isHost,
        hasConfirmedQuestion: !!confirmedQuestion
      });
      return;

    }
    
    try {
      console.log('🎯 handleStartRound: Starting with question:', confirmedQuestion);
      // Transform the confirmed question to match the expected backend format
      const questionData = {
        text: confirmedQuestion.text,
        category: confirmedQuestion.category
      };
      
      console.log('📤 handleStartRound: Calling actions.startNewRound with:', questionData);
      const result = await actions.startNewRound(questionData);
      console.log('✅ handleStartRound: Success result:', result);

      
      // Call the callback to notify Game.js if needed
      if (onStartRound) {
        onStartRound(questionData);
      }
      
    } catch (error) {
      console.error('❌ handleStartRound: Error caught:', {
        message: error.message,
        stack: error.stack,
        isAuthError: error.isAuthError,
        status: error.status
      });
      console.error('Failed to start round:', error);
      // Error is handled by the action system
    }
  };

  // Handle host override with action management
  const handleHostOverride = async () => {
    if (!isHost) return;
    
    try {
      await actions.hostOverrideQuestion();
      
      // Call the callback to notify Game.js if needed
      if (onHostOverride) {
        onHostOverride();
      }
      
    } catch (error) {
      console.error('Failed to override question:', error);
      // Error is handled by the action system
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
          
          {/* Action Errors */}
          <ActionError 
            error={getError('setWinnerSelectedQuestion') || getError('startNewRound') || getError('hostOverrideQuestion')} 
            onDismiss={() => {
              clearError('setWinnerSelectedQuestion');
              clearError('startNewRound');
              clearError('hostOverrideQuestion');
            }}
            className="mb-6"
          />
          
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
                    <ActionButton
                      onClick={handleStartRound}
                      isLoading={isPending('startNewRound')}
                      loadingText="STARTING ROUND..."
                      className="btn-gold text-lg px-8 py-3"
                    >
                      START NEXT ROUND
                    </ActionButton>
                    <p className="text-xs text-silver mt-2">
                      Begin the round with {winner?.displayName}'s selected question
                    </p>
                  </div>
                  
                  {/* Host Override Button */}
                  <div>
                    <ActionButton
                      onClick={handleHostOverride}
                      isLoading={isPending('hostOverrideQuestion')}
                      loadingText="OVERRIDING..."
                      className="btn-stage"
                    >
                      HOST OVERRIDE - CHOOSE DIFFERENT QUESTION
                    </ActionButton>
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
                    <ActionButton
                      onClick={handleHostOverride}
                      isLoading={isPending('hostOverrideQuestion')}
                      loadingText="OVERRIDING..."
                      className="btn-stage text-sm"
                    >
                      HOST OVERRIDE - CHOOSE QUESTION YOURSELF
                    </ActionButton>
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
                  
                  {/* Show loading state if winner selection is pending */}
                  {isPending('setWinnerSelectedQuestion') && (
                    <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-4 border border-electric-purple/30 text-center mt-4">
                      <div className="flex items-center justify-center">
                        <VinylRecord className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-electric-purple">Finalizing your selection...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Question Selection using QuestionSelector component - Auto-loads immediately */
                <QuestionSelector
                  gameId={game._id}
                  accessToken={currentUser.accessToken}
                  onQuestionSelected={handleWinnerQuestionSelected}
                  onCancel={null} // No back button for winner - they must choose
                  autoLoad={true} // Automatically load a question when component mounts
                  confirmButtonText={isPending('setWinnerSelectedQuestion') ? "CONFIRMING..." : "CONFIRM THIS QUESTION"}
                  title="CHOOSE THE NEXT QUESTION"
                  showBackButton={false} // Winner can't go back - they must choose
                />
              )}
              
              {/* Loading indicator when confirming question */}
              {isPending('setWinnerSelectedQuestion') && !confirmedQuestion && (
                <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-4 border border-electric-purple/30 text-center">
                  <div className="flex items-center justify-center">
                    <VinylRecord className="w-5 h-5 animate-spin mr-2" />
                    <span className="text-electric-purple">Confirming your question...</span>
                  </div>
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

                {/* Show loading states for non-winners too */}
                {isPending('setWinnerSelectedQuestion') && (
                  <div className="mt-4 bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-3 border border-electric-purple/30">
                    <div className="flex items-center justify-center">
                      <VinylRecord className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-electric-purple text-sm">Question being confirmed...</span>
                    </div>
                  </div>
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