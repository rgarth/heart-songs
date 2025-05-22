// client/src/components/game/QuestionSelectionScreen.js - Updated Version
import React, { useState } from 'react';
import { getRandomQuestion, submitCustomQuestion, setWinnerSelectedQuestion } from '../../services/gameService';
import VinylRecord from '../VinylRecord';

const QuestionSelectionScreen = ({ game, currentUser, onQuestionSelected, onStartRound, onHostOverride, getWinnerInfo }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(game.winnerSelectedQuestion || null);
  const [loading, setLoading] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState(null);

  const isHost = game.host._id === currentUser.id;
  
  // Get the winner's info using the provided function
  const winnerInfo = getWinnerInfo ? getWinnerInfo() : { winner: null, isTie: false, reason: 'no_winner' };
  const { winner, isTie, tiedPlayers } = winnerInfo;
  const isWinner = winner && winner._id === currentUser.id;

  // Handle getting a random question (winner only)
  const handleGetRandomQuestion = async () => {
    if (!isWinner) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(game._id, currentUser.accessToken);
      setSelectedQuestion(questionData.question);
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
      
      setSelectedQuestion(questionData.question);
      setCustomQuestionMode(false);
    } catch (error) {
      console.error('Error submitting custom question:', error);
      setError('Failed to submit custom question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm question selection (winner only)
  const handleConfirmQuestion = async () => {
    if (!isWinner || !selectedQuestion) return;
    
    try {
      setLoading(true);
      
      // Send question to server
      await setWinnerSelectedQuestion(game._id, selectedQuestion, currentUser.accessToken);
      
      if (onQuestionSelected) {
        onQuestionSelected(selectedQuestion);
      }
    } catch (error) {
      console.error('Error confirming question:', error);
      setError('Failed to confirm question. Please try again.');
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
          
          {/* Winner Crown Display */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-gold-record/20 to-yellow-400/20 rounded-lg p-6 border border-gold-record/40">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <VinylRecord 
                    className="w-16 h-16"
                    animationClass="animate-vinyl-spin"
                  />
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="text-2xl">👑</span>
                  </div>
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
                Gets to choose the next question
              </p>
            </div>
          </div>

          {isWinner ? (
            /* Winner Controls */
            <div className="space-y-6">
              
              {!selectedQuestion ? (
                /* Question Selection */
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
                          {loading ? 'Setting Question...' : 'Set This Question'}
                        </button>
                        <button
                          onClick={() => setCustomQuestionMode(false)}
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
                            Loading...
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
              ) : (
                /* Question Preview & Confirmation */
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border-l-4 border-neon-pink">
                    <h4 className="text-lg font-rock text-neon-pink mb-3">YOUR SELECTED QUESTION</h4>
                    <p className="text-xl font-bold text-white mb-2">{selectedQuestion.text}</p>
                    <p className="text-silver">
                      <span className="bg-electric-purple/20 px-2 py-1 rounded">
                        {selectedQuestion.category}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setSelectedQuestion(null)}
                      className="btn-stage"
                    >
                      Choose Different Question
                    </button>
                    
                    <button
                      onClick={handleConfirmQuestion}
                      disabled={loading}
                      className="btn-gold disabled:opacity-50"
                    >
                      {loading ? 'Confirming...' : 'Confirm This Question'}
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
                
                {selectedQuestion && (
                  <div className="mt-6 bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border border-neon-pink/40">
                    <h4 className="text-neon-pink font-bold mb-2">QUESTION SELECTED:</h4>
                    <p className="text-white text-lg">{selectedQuestion.text}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Host Controls - Start Round or Override */}
          {isHost && (
            <div className="mt-8 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
              <h4 className="text-lg font-rock text-gold-record mb-4 text-center">MC CONTROLS</h4>
              
              <div className="flex flex-col gap-4">
                {/* Start Round Button (only if question is selected) */}
                {selectedQuestion && (
                  <div className="text-center">
                    <button
                      onClick={() => onStartRound(selectedQuestion)}
                      className="btn-gold"
                    >
                      START NEXT ROUND
                    </button>
                    <p className="text-xs text-silver mt-2">
                      Begin the round with {winner?.displayName}'s selected question
                    </p>
                  </div>
                )}
                
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

        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionScreen;