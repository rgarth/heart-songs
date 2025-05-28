// client/src/components/bot/AddBotModal.js
import React, { useState, useEffect } from 'react';
import botService from '../../services/botService';
import BotPersonalitySelector from './BotPersonalitySelector';

const AddBotModal = ({ isOpen, onClose, onAddBot, gameId }) => {
  const [personalities, setPersonalities] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState('eclectic');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPersonalities();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const loadPersonalities = async () => {
    try {
      const data = await botService.getPersonalities();
      setPersonalities(data);
      
      // Set default personality if available
      if (data.length > 0 && !selectedPersonality) {
        setSelectedPersonality(data[0].id);
      }
    } catch (error) {
      setError('Failed to load bot personalities');
      console.error('Error loading personalities:', error);
    }
  };

  const handleAddBot = async () => {
    try {
      setIsAdding(true);
      setError(null);
      setSuccess(null);
      
      const result = await botService.addBotToGame(gameId, selectedPersonality);
      
      setSuccess(`${result.botName} is joining the game!`);
      
      // Wait a moment to show success message
      setTimeout(() => {
        onAddBot(result);
        onClose();
      }, 1500);
      
    } catch (error) {
      setError(error.message || 'Failed to add bot');
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/50 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-rock neon-text bg-gradient-to-r from-electric-purple to-neon-pink bg-clip-text text-transparent">
              ADD AI BAND MEMBER
            </h3>
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="text-silver hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-silver mb-6">
            Choose a personality for your AI band member. Each bot has different music preferences and playing styles that will influence their song choices and voting behavior.
          </p>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-gradient-to-r from-lime-green/20 to-green-600/20 border border-lime-green/40 rounded-lg p-4">
              <div className="flex items-center text-lime-green">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-4">
              <div className="flex items-center text-stage-red">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Personality Selection */}
          <div className="mb-6">
            <h4 className="text-lg font-rock text-turquoise mb-4">CHOOSE PERSONALITY</h4>
            <BotPersonalitySelector
              personalities={personalities}
              selectedPersonality={selectedPersonality}
              onPersonalitySelect={setSelectedPersonality}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-electric-purple/30 flex-shrink-0">
          <div className="flex gap-4 justify-end">
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="px-6 py-2 bg-stage-dark text-silver border border-electric-purple/30 rounded-lg hover:bg-electric-purple/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBot}
              disabled={isAdding || personalities.length === 0 || success}
              className="px-6 py-2 bg-gradient-to-r from-electric-purple to-neon-pink text-white rounded-lg hover:shadow-lg hover:shadow-electric-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding Bot...
                </>
              ) : success ? (
                'Bot Added!'
              ) : (
                'Add Bot to Game'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBotModal;