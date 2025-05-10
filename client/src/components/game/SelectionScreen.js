// client/src/components/game/SelectionScreen.js  
import React, { useState, useEffect } from 'react';
import { submitSong } from '../../services/gameService';
import { searchSongs, addYoutubeDataToTrack, formatSongForSubmission } from '../../services/musicService';

const SelectionScreen = ({ game, currentUser, accessToken }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [speedBonusEarned, setSpeedBonusEarned] = useState(false);
  const [error, setError] = useState(null);
  const [loadingYoutube, setLoadingYoutube] = useState(false);

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
      
      // Use the new musicService to search Last.fm only (no YouTube)
      const results = await searchSongs(searchQuery);
      setSearchResults(results);
      
    } catch (error) {
      console.error('Error searching songs:', error);
      setSearchError('Failed to search for songs. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Check if song is already selected by another player
  const isSongAlreadySelected = (songId) => {
    return game.submissions.some(submission => 
      submission.songId === songId && submission.player._id !== currentUser.id
    );
  };
  
  // Handle track selection with YouTube data loading
  const handleSelectTrack = async (track) => {
    setDuplicateError(null);
    
    // Check if this song is already selected by another player
    if (isSongAlreadySelected(track.id)) {
      setDuplicateError(`"${track.name}" has already been selected by another player. Please choose a different song.`);
      return;
    }
    
    try {
      setLoadingYoutube(true);
      
      // Now load YouTube data for the selected track
      const trackWithYoutube = await addYoutubeDataToTrack(track);
      
      setSelectedSong(trackWithYoutube);
      setLoadingYoutube(false);
    } catch (error) {
      console.error('Error loading YouTube data:', error);
      // Still set the song even if YouTube fails
      setSelectedSong(track);
      setLoadingYoutube(false);
    }
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
      
      // Format the song data properly for submission
      const formattedSong = {
        id: selectedSong.id,
        name: selectedSong.name,
        artist: selectedSong.artist,
        albumCover: selectedSong.albumArt || '',
        youtubeId: selectedSong.youtubeId || null
      };
      
      console.log("Submitting song:", formattedSong);
      
      const response = await submitSong(game._id, currentUser.id, formattedSong, accessToken);
      
      setHasSubmitted(true);
      
      // Show speed bonus notification if player got it
      if (response.gotSpeedBonus) {
        setSpeedBonusEarned(true);
      }
    } catch (error) {
      console.error('Error submitting song:', error);
      setError('Failed to submit your song. Please try again.');
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
            {speedBonusEarned && (
              <div className="bg-yellow-600/30 p-3 rounded-lg inline-block mb-2">
                <span className="text-yellow-400 font-bold flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Speed Bonus Earned! (+1 point)
                </span>
              </div>
            )}
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
                {loadingYoutube ? (
                  <div className="flex items-center justify-center bg-gray-700 p-6 rounded-lg">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className="text-gray-300">Loading YouTube data...</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-gray-700 p-3 rounded-lg">
                    {selectedSong.albumArt && (
                      <img 
                        src={selectedSong.albumArt} 
                        alt={selectedSong.name} 
                        className="w-16 h-16 rounded mr-4" 
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{selectedSong.name}</p>
                      <p className="text-sm text-gray-400">
                        {selectedSong.artist}
                      </p>
                      {selectedSong.album && (
                        <p className="text-xs text-gray-500">
                          {selectedSong.album}
                        </p>
                      )}
                      {selectedSong.youtubeId ? (
                        <p className="text-xs text-green-400 mt-1">YouTube video found</p>
                      ) : (
                        <p className="text-xs text-orange-400 mt-1">No YouTube video found</p>
                      )}
                    </div>
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Confirm'}
                    </button>
                  </div>
                )}
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
                        {track.albumArt && (
                          <img 
                            src={track.albumArt} 
                            alt={track.name} 
                            className="w-12 h-12 rounded mr-3" 
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{track.name}</p>
                          <p className="text-sm text-gray-400">
                            {track.artist}
                          </p>
                          {track.album && (
                            <p className="text-xs text-gray-500">
                              {track.album}
                            </p>
                          )}
                          {isAlreadySelected && (
                            <p className="text-xs text-yellow-500 mt-1">
                              Already selected by another player
                            </p>
                          )}
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="bg-gray-600 px-2 py-1 rounded text-gray-300">
                            {track.youtubeId ? 'Video Available' : 'No Video Yet'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 bg-red-500 text-white p-3 rounded">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SelectionScreen;