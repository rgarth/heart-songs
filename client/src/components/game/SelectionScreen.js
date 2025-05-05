// client/src/components/game/SelectionScreen.js
import React, { useState, useEffect } from 'react';
import { submitSong } from '../../services/gameService';
import { searchTracks } from '../../services/spotifyService';

const SelectionScreen = ({ game, currentUser, accessToken }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  
  // Check if there are active players (from force start)
  const hasActivePlayers = game.activePlayers && game.activePlayers.length > 0;
  
  // Count of expected submissions
  const expectedSubmissions = hasActivePlayers 
    ? game.activePlayers.length 
    : game.players.length;
  
  // Count of submitted players
  const submittedCount = game.submissions.length;
  const totalPlayers = hasActivePlayers ? game.activePlayers.length : game.players.length;
  
  // Check if user has already submitted
  useEffect(() => {
    const userSubmission = game.submissions.find(s => s.player._id === currentUser.id);
    if (userSubmission) {
      setHasSubmitted(true);
    }
  }, [game.submissions, currentUser.id]);
  
  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    try {
      setSearchLoading(true);
      setSearchError(null);
      setDuplicateError(null);
      
      // FIXED: Don't pass the accessToken to searchTracks function
      // The searchTracks function doesn't need authentication
      const results = await searchTracks(searchQuery);
      setSearchResults(results);
      
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchError('Failed to search tracks. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Check if song is already selected by another player
  const isSongAlreadySelected = (trackId) => {
    return game.submissions.some(submission => 
      submission.songId === trackId && submission.player._id !== currentUser.id
    );
  };
  
  // Handle track selection
  const handleSelectTrack = (track) => {
    setDuplicateError(null);
    
    // Check if this song is already selected by another player
    if (isSongAlreadySelected(track.id)) {
      setDuplicateError(`"${track.name}" has already been selected by another player. Please choose a different song.`);
      // Don't set the track as selected
      return;
    }
    
    setSelectedSong(track);
  };
  
  // Handle song submission
  const handleSubmit = async () => {
    if (!selectedSong) return;
    
    // Double-check for duplicate before submitting
    if (isSongAlreadySelected(selectedSong.id)) {
      setDuplicateError(`"${selectedSong.name}" has already been selected by another player. Please choose a different song.`);
      setSelectedSong(null);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await submitSong(game._id, currentUser.id, selectedSong, accessToken);
      
      setHasSubmitted(true);
    } catch (error) {
      console.error('Error submitting song:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Check if user is active in the current round (either all players or specifically included)
  const isUserActive = () => {
    // If no activePlayers list exists or it's empty, consider all players active
    if (!game.activePlayers || game.activePlayers.length === 0) {
      return true;
    }
    
    // Otherwise, check if the current user is in the activePlayers list
    return game.activePlayers.some(player => {
      // Handle both object and string comparisons
      if (typeof player === 'object' && player._id) {
        return player._id === currentUser.id;
      }
      return player === currentUser.id;
    });
  };
  
  // Use the function to determine active status
  const userIsActive = isUserActive();
  
  // If user is not active in this round, show a message
  if (!userIsActive) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Song Selection</h2>
          
          <div className="text-center mb-6">
            <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
          </div>
          
          <div className="py-10">
            <div className="mb-4">
              <svg className="w-16 h-16 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-purple-400 mb-2">Observing This Round</h3>
            <p className="text-gray-300 mb-4">
              You weren't ready when the host started this round, so you're just observing.
            </p>
            <p className="text-gray-400 text-sm">
              You'll be able to participate in the next round when the host starts it.
            </p>
          </div>
          
          <div className="mt-6">
            <p className="text-sm text-gray-400">
              {submittedCount} of {totalPlayers} active players have submitted songs
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Song Selection</h2>
        
        <div className="text-center mb-6">
          <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
        </div>
        
        {hasActivePlayers && game.activePlayers.length < game.players.length && (
          <div className="mb-4 p-3 bg-purple-900/50 text-purple-200 rounded-lg text-sm">
            <p><strong>Note:</strong> This round is being played with {game.activePlayers.length} out of {game.players.length} players. Only players who were ready when the game started are participating.</p>
          </div>
        )}
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm">
            Pick a song that best answers this question
          </p>
          <p className="text-sm text-gray-400">
            {submittedCount} of {totalPlayers} submitted
          </p>
        </div>
        
        {hasSubmitted ? (
          <div className="text-center py-10">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-green-500 mb-2">Song Submitted!</h3>
            <p className="text-gray-300">Waiting for other players to submit their songs...</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a song..."
                  className="flex-1 p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit"
                  disabled={searchLoading || !searchQuery.trim()}
                  className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            
            {searchError && (
              <div className="bg-red-500 text-white p-3 rounded mb-4">
                {searchError}
              </div>
            )}
            
            {duplicateError && (
              <div className="bg-yellow-600 text-white p-3 rounded mb-4">
                {duplicateError}
              </div>
            )}
            
            {selectedSong && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Selected Song</h3>
                <div className="flex items-center bg-gray-700 p-3 rounded-lg">
                  {selectedSong.album.images[0] && (
                    <img 
                      src={selectedSong.album.images[0].url} 
                      alt={selectedSong.name} 
                      className="w-16 h-16 rounded mr-4" 
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{selectedSong.name}</p>
                    <p className="text-sm text-gray-400">
                      {selectedSong.artists.map(artist => artist.name).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedSong.album.name}
                    </p>
                  </div>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Search Results</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {searchResults.map(track => {
                    const isAlreadySelected = isSongAlreadySelected(track.id);
                    return (
                      <div 
                        key={track.id}
                        onClick={() => !isAlreadySelected && handleSelectTrack(track)}
                        className={`flex items-center p-3 rounded-lg transition-colors ${
                          isAlreadySelected 
                            ? 'bg-gray-700 opacity-60 cursor-not-allowed'
                            : selectedSong?.id === track.id 
                              ? 'bg-gray-700 border border-blue-500 cursor-pointer hover:bg-gray-700'
                              : 'bg-gray-750 cursor-pointer hover:bg-gray-700'
                        }`}
                      >
                        {track.album.images[0] && (
                          <img 
                            src={track.album.images[0].url} 
                            alt={track.name} 
                            className="w-12 h-12 rounded mr-3" 
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{track.name}</p>
                          <p className="text-sm text-gray-400">
                            {track.artists.map(artist => artist.name).join(', ')}
                          </p>
                          {isAlreadySelected && (
                            <p className="text-xs text-yellow-500 mt-1">
                              Already selected by another player
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SelectionScreen;