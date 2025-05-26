import React, { useState, useEffect } from 'react';
import { getRandomQuestion, submitCustomQuestion, setWinnerSelectedQuestion } from '../../services/gameService';
import VinylRecord from '../VinylRecord';

const QuestionSelectionScreen = ({ game, currentUser, onQuestionSelected, onStartRound, onHostOverride, getWinnerInfo }) => {
  // Use server state as the source of truth, with local state for preview
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [questionConfirmed, setQuestionConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
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
      setQuestionConfirmed(true);
      setPreviewQuestion(null); // Clear preview since we have a confirmed question
    } else {
      setQuestionConfirmed(false);
    }
  }, [confirmedQuestion]);

  // Handle getting a random question (winner only)
  const handleGetRandomQuestion = async () => {
    if (!isWinner) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(game._id, currentUser.accessToken);
      setPreviewQuestion(questionData.question);
      setCustomQuestionMode(false); // Exit custom mode
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to fetch question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle custom question submission (winner only)
  const handleSubmitCustomQuestion = async () => {
    if (!isWinner || !customQuestion.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await submitCustomQuestion(
        game._id, 
        customQuestion.trim(),
        currentUser.accessToken
      );
      
      setPreviewQuestion(questionData.question);
      setCustomQuestionMode(false);
      setCustomQuestion(''); // Clear the input
    } catch (error) {
      console.error('Error submitting custom question:', error);
      setError('Failed to submit custom question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm question selection (winner only)
  const handleConfirmQuestion = async () => {
    
    if (!isWinner) {
      setError('Only the round winner can select the question');
      return;
    }
    
    if (!previewQuestion) {
      setError('Please select a question first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to save the winner's selected question
      const result = await setWinnerSelectedQuestion(
        game._id, 
        previewQuestion, 
        currentUser.accessToken
      );
      
      // Update local state immediately for better UX
      setQuestionConfirmed(true);
      setPreviewQuestion(null);
      
      // Call the callback to notify Game.js
      if (onQuestionSelected) {
        onQuestionSelected(previewQuestion);
      }
      
    } catch (error) {
      setError(`Failed to confirm question: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle choosing a different question (clear preview)
  const handleChooseDifferent = () => {
    setPreviewQuestion(null);
    setCustomQuestionMode(false);
    setCustomQuestion('');
    setError(null);
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

          {/* Host Controls - Right after confirmed question */}
          {isHost && confirmedQuestion && (
            <div className="mb-8 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
              <h4 className="text-lg font-rock text-gold-record mb-6 text-center">MC CONTROLS</h4>
              
              <div className="flex flex-col gap-4">
                {/* Start Round Button */}
                <div className="text-center">
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
                <div className="text-center">
                  <button
                    onClick={onHostOverride}
                    className="btn-stage"
                  >
                    HOST OVERRIDE - CHOOSE QUESTION YOURSELF
                  </button>
                  <p className="text-xs text-silver mt-2">
                    Skip winner selection and choose the question yourself
                  </p>
                </div>
              </div>
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
              ) : previewQuestion ? (
                /* Question Preview & Confirmation */
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border-l-4 border-neon-pink">
                    <h4 className="text-lg font-rock text-neon-pink mb-3">PREVIEW QUESTION</h4>
                    <p className="text-xl font-bold text-white mb-2">{previewQuestion.text}</p>
                    <p className="text-silver">
                      <span className="bg-electric-purple/20 px-2 py-1 rounded">
                        {previewQuestion.category}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleChooseDifferent}
                      disabled={loading}
                      className="btn-stage disabled:opacity-50"
                    >
                      Choose Different Question
                    </button>
                    
                    <button
                      onClick={handleConfirmQuestion}
                      disabled={loading}
                      className="btn-gold disabled:opacity-50"
                    >
                      {loading ? 'Confirming...' : 'Use This Question'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Initial Question Selection */
                <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                  <h4 className="text-lg font-rock text-neon-pink mb-4 text-center">CHOOSE THE NEXT QUESTION</h4>
                  
                  {customQuestionMode ? (
                    /* Custom Question Mode */
                    <div className="space-y-4">
                      <textarea
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="e.g., What song would you play at a robot wedding?"
                        className="w-full p-4 bg-vinyl-black text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all"
                        rows={3}
                      />
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={handleSubmitCustomQuestion}
                          disabled={loading || !customQuestion.trim()}
                          className="btn-gold disabled:opacity-50"
                        >
                          {loading ? 'Creating Question...' : 'Preview This Question'}
                        </button>
                        <button
                          onClick={() => {
                            setCustomQuestionMode(false);
                            setCustomQuestion('');
                          }}
                          className="btn-stage"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Random/Custom Choice */
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={handleGetRandomQuestion}
                        disabled={loading}
                        className="btn-electric disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <VinylRecord className="w-5 h-5 animate-spin mr-2 inline-block" />
                            Loading Random Question...
                          </>
                        ) : (
                          'Get Random Question'
                        )}
                      </button>
                      
                      <button
                        onClick={() => setCustomQuestionMode(true)}
                        className="btn-stage"
                      >
                        Write Custom Question
                      </button>
                    </div>
                  )}
                </div>
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