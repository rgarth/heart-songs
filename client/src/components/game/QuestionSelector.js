// client/src/components/game/QuestionSelector.js
import React, { useState, useEffect } from 'react';
import { getRandomQuestion, submitCustomQuestion } from '../../services/gameService';
import VinylRecord from '../VinylRecord';

/**
 * Reusable Question Selector Component
 * Used across Lobby, Results, and Question Selection screens
 * 
 * @param {Object} props
 * @param {string} props.gameId - Game ID for API calls
 * @param {string} props.accessToken - User access token
 * @param {Function} props.onQuestionSelected - Called when question is confirmed (question) => void
 * @param {Function} props.onCancel - Called when user wants to go back
 * @param {boolean} props.autoLoad - Whether to automatically load a question on mount
 * @param {string} props.confirmButtonText - Text for the confirm button (default: "Use This Question")
 * @param {string} props.title - Title for the panel (default: "CHOOSE QUESTION")
 * @param {boolean} props.showBackButton - Whether to show back button (default: true)
 */
const QuestionSelector = ({ 
  gameId, 
  accessToken, 
  onQuestionSelected, 
  onCancel,
  autoLoad = false,
  confirmButtonText = "Use This Question",
  title = "CHOOSE QUESTION",
  showBackButton = true
}) => {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customQuestionMode, setCustomQuestionMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [error, setError] = useState(null);

  // Auto-load question on mount if requested
  useEffect(() => {
    if (autoLoad && !question) {
      handleGetRandomQuestion();
    }
  }, [autoLoad]);

  // Get a random question
  const handleGetRandomQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await getRandomQuestion(gameId, accessToken);
      setQuestion(questionData.question);
      setCustomQuestionMode(false); // Exit custom mode
    } catch (error) {
      console.error('Error fetching question:', error);
      setError('Failed to fetch question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit custom question
  const handleSubmitCustomQuestion = async () => {
    if (!customQuestion.trim()) {
      setError('Please enter a question');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const questionData = await submitCustomQuestion(
        gameId, 
        customQuestion.trim(),
        accessToken
      );
      
      setQuestion(questionData.question);
      setCustomQuestionMode(false);
      setCustomQuestion(''); // Clear the input
    } catch (error) {
      console.error('Error submitting custom question:', error);
      setError('Failed to submit custom question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm the selected question
  const handleConfirmQuestion = () => {
    if (!question) {
      setError('Please select a question first');
      return;
    }
    
    if (onQuestionSelected) {
      onQuestionSelected(question);
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setQuestion(null);
    setCustomQuestionMode(false);
    setCustomQuestion('');
    setError(null);
  };

  // Handle back/cancel
  const handleBack = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-gradient-to-b from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
      
      {/* Header with optional back button */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-rock text-neon-pink">{title}</h4>
        {showBackButton && onCancel && (
          <button
            onClick={handleBack}
            className="flex items-center text-silver hover:text-white transition-colors group text-sm"
          >
            <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        )}
      </div>

      {customQuestionMode ? (
        /* Custom Question Mode */
        <div className="space-y-4">
          <div>
            <label className="block text-silver text-sm font-medium mb-2">
              WRITE YOUR OWN QUESTION
            </label>
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="e.g., What song would you play at a robot wedding?"
              className="w-full p-4 bg-vinyl-black text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all"
              rows={3}
            />
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleSubmitCustomQuestion}
              disabled={loading || !customQuestion.trim()}
              className="btn-gold disabled:opacity-50"
            >
              {loading ? (
                <>
                  <VinylRecord className="w-4 h-4 animate-spin mr-2 inline-block" />
                  Creating Question...
                </>
              ) : (
                'Preview This Question'
              )}
            </button>
            <button
              onClick={() => {
                setCustomQuestionMode(false);
                setCustomQuestion('');
                setError(null);
              }}
              className="btn-stage"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : question ? (
        /* Question Preview & Controls */
        <div className="space-y-4">
          {/* Question Display */}
          <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border-l-4 border-neon-pink">
            <p className="text-white font-bold text-xl mb-2">{question.text}</p>
            <p className="text-silver text-sm">
              <span className="bg-electric-purple/20 px-2 py-1 rounded">
                {question.category}
              </span>
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleGetRandomQuestion}
              disabled={loading}
              className="btn-stage text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <VinylRecord className="w-4 h-4 animate-spin mr-2 inline-block" />
                  Loading...
                </>
              ) : (
                'Different Question'
              )}
            </button>
            
            <button
              onClick={() => {
                setCustomQuestionMode(true);
                setError(null);
              }}
              className="btn-electric text-sm"
            >
              Write Custom
            </button>
            
            <button
              onClick={handleConfirmQuestion}
              className="btn-gold text-sm"
            >
              {confirmButtonText}
            </button>
          </div>

          {/* Reset option */}
          <div className="text-center">
            <button
              onClick={handleReset}
              className="text-silver hover:text-white transition-colors text-sm"
            >
              Start Over
            </button>
          </div>
        </div>
      ) : (
        /* Initial State - No Question Selected */
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="mb-4">
              <VinylRecord 
                className="w-16 h-16 mx-auto"
                animationClass="animate-vinyl-spin"
              />
            </div>
            <p className="text-silver mb-6">Choose how you want to select your question</p>
            
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
                onClick={() => {
                  setCustomQuestionMode(true);
                  setError(null);
                }}
                className="btn-stage"
              >
                Write Custom Question
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-3 text-center">
          <span className="text-stage-red text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default QuestionSelector;