// client/src/components/game/SelectionScreen.js - Rockstar Design Edition
import React, { useState, useEffect } from 'react';
import { submitSong, startEndSelectionCountdown } from '../../services/gameService';
import { searchSongs } from '../../services/musicService';
import VinylRecord from '../VinylRecord';

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
  const [isPassConfirmShowing, setIsPassConfirmShowing] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  
  // NEW: Server countdown state
  const [isStartingCountdown, setIsStartingCountdown] = useState(false);
  const [countdownError, setCountdownError] = useState(null);

  // Check if there are active players (from force start)
  const hasActivePlayers = game.activePlayers && game.activePlayers.length > 0;
  
  // Count of submitted players
  const submittedCount = game.submissions.length;
  const totalPlayers = hasActivePlayers ? game.activePlayers.length : game.players.length;
  
  // Check if current user is the host
  const isHost = game.host._id === currentUser.id;
  
  // Check if user has already submitted or passed
  useEffect(() => {
    const userSubmission = game.submissions.find(s => s.player._id === currentUser.id);
    if (userSubmission) {
      setHasSubmitted(true);
      setHasPassed(userSubmission.hasPassed || false);
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
      
      // Search only Last.fm - no YouTube data needed
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
  
  // Handle track selection - no YouTube data needed during selection
  const handleSelectTrack = (track) => {
    setDuplicateError(null);
    
    // Check if this song is already selected by another player
    if (isSongAlreadySelected(track.id)) {
      setDuplicateError(`"${track.name}" has already been selected by another player. Please choose a different song.`);
      return;
    }
    
    // Just set the track - no YouTube loading during selection
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
      
      // Format the song data without YouTube ID (will be fetched during voting)
      const formattedSong = {
        id: selectedSong.id,
        name: selectedSong.name,
        artist: selectedSong.artist,
        albumCover: selectedSong.albumArt || '',
        youtubeId: null, // Will be fetched during voting
      };
      
      const response = await submitSong(game._id, currentUser.id, formattedSong, accessToken);
      
      setHasSubmitted(true);
      setHasPassed(false);
      
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
  
  // Handle pass submission
  const handlePass = async () => {
    try {
      setIsSubmitting(true);
      
      // Submit with a special pass indicator
      const passData = {
        id: 'PASS',
        name: 'PASS',
        artist: 'PASS',
        albumCover: '',
        youtubeId: null,
        hasPassed: true, // Special flag to indicate this is a pass
      };
      
      await submitSong(game._id, currentUser.id, passData, accessToken);
      
      setHasSubmitted(true);
      setHasPassed(true);
      setIsPassConfirmShowing(false);
    } catch (error) {
      console.error('Error submitting pass:', error);
      setError('Failed to submit your pass. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // NEW: Handle end selection with server countdown
  const handleEndSelectionWithCountdown = async () => {
    if (!isHost) return;
    try {
      setIsStartingCountdown(true);
    
      setCountdownError(null);
  
      // Start the server-side countdown
      await startEndSelectionCountdown(game._id, accessToken);
      
      // The countdown banner will appear for all players via the server state
    } catch (error) {
      console.error('Error starting end selection countdown:', error);
      setCountdownError('Failed to start countdown. Please try again.');
    } finally {
      setIsStartingCountdown(false);
    }
  };
  
  // Check if user is active in the current round
  const isUserActive = () => {
    if (!game.activePlayers || game.activePlayers.length === 0) {
      return true;
    }
    
    return game.activePlayers.some(player => {
      if (typeof player === 'object' && player._id) {
        return player._id === currentUser.id;
      }
      return player === currentUser.id;
    });
  };
  
  const userIsActive = isUserActive();
  
  // If user is not active in this round, show a message
  if (!userIsActive) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Stage card for observers */}
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
          
          {/* Stage header */}
          <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
            <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
              SONG SELECTION
            </h2>
            
            <div className="text-center mt-4">
              <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record">
                <p className="text-gold-record font-bold text-xl">{game.currentQuestion.text}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 text-center">
            {/* Observation mode indicator */}
            <div className="mb-6">
              <div className="relative w-24 h-24 mx-auto">
                <VinylRecord 
                  className="w-24 h-24 opacity-50" 
                  animationClass=""
                />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  <span className="text-silver">OBSERVE</span>
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-rock text-electric-purple mb-4">BACKSTAGE OBSERVER</h3>
            <p className="text-silver text-lg mb-4">
              You weren't ready when the MC started this set, so you're watching from the wings.
            </p>
            <p className="text-turquoise text-sm mb-8">
              You'll be able to join the next song when the host starts it.
            </p>
            
            {/* Host controls for ending selection */}
            {isHost && (
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                <h4 className="text-lg font-rock text-gold-record mb-4">MC CONTROLS</h4>
                <button
                  onClick={handleEndSelectionWithCountdown}
                  disabled={isStartingCountdown || game.countdown?.isActive}
                  className="btn-electric disabled:opacity-50"
                >
                  {isStartingCountdown ? (
                    <>
                      <div className="relative w-5 h-5 mr-3 inline-block">
                        <VinylRecord 
                          className="w-5 h-5" 
                          animationClass="animate-vinyl-spin"
                        />
                      </div>
                      STARTING COUNTDOWN...
                    </>
                  ) : game.countdown?.isActive ? (
                    'COUNTDOWN ACTIVE'
                  ) : (
                    <>
                      END SONG SELECTION
                    </>
                  )}
                </button>
                <p className="text-xs text-silver mt-3">
                  Force all non-submitted players to sit this one out
                </p>
                {countdownError && (
                  <div className="mt-3 p-3 bg-red-900/50 text-red-200 rounded text-sm">
                    {countdownError}
                  </div>
                )}
              </div>
            )}
            
            {/* Show player progress */}
            <div className="mt-8 bg-gradient-to-r from-turquoise/10 to-lime-green/10 rounded-lg p-4 border border-turquoise/30">
              <div className="flex items-center justify-center text-silver">
                <span>{submittedCount} of {totalPlayers} players have submitted songs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Main stage card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* Stage header */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <div className="text-center mt-4">
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border-l-4 border-gold-record">
              <p className="text-gold-record font-bold text-xl">{game.currentQuestion.text}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          
          {/* Active players info */}
          {hasActivePlayers && game.activePlayers.length < game.players.length && (
            <div className="mb-6 bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-4 border border-electric-purple/30">
              <div className="flex items-center text-purple-200">
                <span className="font-medium">
                  This set features {game.activePlayers.length} out of {game.players.length} band members.
                  Only players who were ready when the show started are performing.
                </span>
              </div>
            </div>
          )}
          
          {/* Player progress - Concert style */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center">
            </div>
            <div className="bg-gradient-to-r from-deep-space to-stage-dark rounded-full px-4 py-2 border border-electric-purple/30">
              <span className="text-gold-record font-bold">{submittedCount}</span>
              <span className="text-silver mx-1">/</span>
              <span className="text-silver">{totalPlayers}</span>
              <span className="text-turquoise ml-2">submitted</span>
            </div>
          </div>
          
          {hasSubmitted ? (
            /* Submitted state - VIP section */
            <div className="text-center py-12">
              <div className="mb-6">
                {hasPassed ? (
                  <div className="relative w-20 h-20 mx-auto">
                    <VinylRecord 
                      className="w-20 h-20 opacity-60" 
                      animationClass=""
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                      <span className="text-silver">PASS</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-20 h-20 mx-auto">
                    <VinylRecord 
                      className="w-20 h-20" 
                      animationClass="animate-vinyl-spin"
                    />
                  </div>
                )}
              </div>
              
              <h3 className="text-2xl font-rock text-center mb-4">
                {hasPassed ? (
                  <span className="text-silver">PASSED ON THIS TRACK</span>
                ) : (
                  <span className="text-lime-green">SONG SUBMITTED!</span>
                )}
              </h3>
              
              {!hasPassed && speedBonusEarned && (
                <div className="bg-gradient-to-r from-gold-record/20 to-yellow-400/20 rounded-lg p-4 border border-gold-record/40 inline-block mb-4">
                  <div className="flex items-center text-gold-record font-bold">
                    <span>SPEED BONUS (+1 point)</span>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border border-electric-purple/30 max-w-md mx-auto">
                {hasPassed ? (
                  <p className="text-silver">
                    You passed on this question. Waiting for other players ...
                  </p>
                ) : (
                  <div>
                    <p className="text-silver mb-3">
                      Waiting for other players ...
                    </p>
                  </div>
                )}
              </div>
              
              {/* Host controls when user has submitted */}
              {isHost && (
                <div className="mt-8 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                  <h4 className="text-lg font-rock text-gold-record mb-4">MC CONTROLS</h4>
                  <button
                    onClick={handleEndSelectionWithCountdown}
                    disabled={isStartingCountdown || game.countdown?.isActive}
                    className="btn-electric disabled:opacity-50"
                  >
                    {isStartingCountdown ? (
                      <>
                        <div className="relative w-5 h-5 mr-3 inline-block">
                          <VinylRecord 
                            className="w-5 h-5" 
                            animationClass="animate-vinyl-spin"
                          />
                        </div>
                        STARTING COUNTDOWN...
                      </>
                    ) : game.countdown?.isActive ? (
                      'COUNTDOWN ACTIVE'
                    ) : (
                      <>
                        END SONG SELECTION
                      </>
                    )}
                  </button>
                  <p className="text-xs text-silver mt-3">
                    Force all non-submitted players to pass
                  </p>
                  {countdownError && (
                    <div className="mt-3 p-3 bg-red-900/50 text-red-200 rounded text-sm">
                      {countdownError}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Search section - Mixing board style */}
              <div className="mb-8 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                <h3 className="text-lg font-rock text-neon-pink mb-4 text-center">FIND YOUR SONG</h3>
                
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for the perfect track..."
                      className="w-full p-4 bg-vinyl-black text-white rounded-lg border border-electric-purple/30 focus:border-neon-pink focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all font-concert text-lg placeholder-silver/50"
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center text-electric-purple">
                      <span>SEARCH</span>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim()}
                    className="w-full btn-electric disabled:opacity-50 group"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {searchLoading ? (
                        <>
                          <div className="relative w-5 h-5 mr-3">
                            <VinylRecord 
                              className="w-5 h-5" 
                              animationClass="animate-vinyl-spin"
                            />
                          </div>
                          SEARCHING THE VAULT...
                        </>
                      ) : (
                        <>
                          SEARCH SONGS
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </form>
              </div>
              
              {/* Error displays */}
              {searchError && (
                <div className="mb-6 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-4">
                  <div className="flex items-center text-stage-red">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{searchError}</span>
                  </div>
                </div>
              )}
              
              {duplicateError && (
                <div className="mb-6 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/40 rounded-lg p-4">
                  <div className="flex items-center text-yellow-400">
                    <span className="font-medium">{duplicateError}</span>
                  </div>
                </div>
              )}
              
              {/* Selected song - Featured track */}
              {selectedSong && (
                <div className="mb-8 bg-gradient-to-r from-lime-green/10 to-green-600/10 rounded-lg p-6 border border-lime-green/40">
                  <h3 className="text-lg font-rock text-lime-green mb-4 text-center">YOUR SELECTED TRACK</h3>
                  
                  <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-4 border border-lime-green/30">
                    <div className="flex items-center">
                      {selectedSong.albumArt && (
                        <div className="relative mr-4 flex-shrink-0">
                          <img 
                            src={selectedSong.albumArt} 
                            alt={selectedSong.name} 
                            className="w-20 h-20 rounded-lg border-2 border-gold-record"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{selectedSong.name}</p>
                        <p className="text-silver font-medium">{selectedSong.artist}</p>
                        {selectedSong.album && (
                          <p className="text-xs text-turquoise mt-1">{selectedSong.album}</p>
                        )}
                      </div>
                      <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-gold ml-4 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="relative w-5 h-5 mr-2 inline-block">
                              <VinylRecord 
                                className="w-5 h-5" 
                                animationClass="animate-vinyl-spin"
                              />
                            </div>
                            SUBMITTING...
                          </>
                        ) : (
                          <>
                            SUBMIT TRACK
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                </div>
              )}
              
              {/* Search results - Album collection */}
              {searchResults.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-rock text-neon-pink mb-4 text-center flex items-center justify-center">
                    TRACK COLLECTION
                  </h3>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {searchResults.map(track => {
                      const isAlreadySelected = isSongAlreadySelected(track.id);
                      const isCurrentSelection = selectedSong?.id === track.id;
                      
                      return (
                        <div 
                          key={track.id}
                          onClick={() => !isAlreadySelected && handleSelectTrack(track)}
                          className={`relative rounded-lg transition-all duration-200 ${
                            isAlreadySelected 
                              ? 'bg-gradient-to-r from-stage-red/10 to-red-600/10 border border-stage-red/30 opacity-60 cursor-not-allowed'
                              : isCurrentSelection 
                                ? 'bg-gradient-to-r from-lime-green/10 to-green-600/10 border border-lime-green/40 cursor-pointer'
                                : 'bg-gradient-to-r from-vinyl-black to-stage-dark border border-electric-purple/30 cursor-pointer hover:border-neon-pink/50 hover:shadow-neon-purple/30 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-center p-4">
                            {track.albumArt && (
                              <div className="relative mr-4 flex-shrink-0">
                                <img 
                                  src={track.albumArt} 
                                  alt={track.name} 
                                  className="w-16 h-16 rounded-lg border-2 border-silver"
                                />
                                {isCurrentSelection && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-lime-green rounded-full flex items-center justify-center">
                                    <span className="text-vinyl-black font-bold text-sm">✓</span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-white">{track.name}</p>
                              <p className="text-silver text-sm">{track.artist}</p>
                              {track.album && (
                                <p className="text-xs text-turquoise mt-1">{track.album}</p>
                              )}
                              {isAlreadySelected && (
                                <div className="flex items-center mt-2">
                                  <span className="text-stage-red text-xs font-medium">Already selected by another player</span>
                                </div>
                              )}
                            </div>
                            
                            {!isAlreadySelected && (
                              <div className="text-right">
                                {isCurrentSelection ? (
                                  <div className="flex items-center text-lime-green font-bold">
                                    <span className="mr-1">✓</span>
                                    <span>SELECTED</span>
                                  </div>
                                ) : (
                                  <div className="text-electric-purple text-sm hover:text-neon-pink transition-colors">
                                    Click to select →
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Pass option - Sit this one out */}
              <div className="border-t border-electric-purple/30 pt-6">
                {isPassConfirmShowing ? (
                  <div className="bg-gradient-to-r from-deep-space/80 to-stage-dark/80 rounded-lg p-6 border border-yellow-600/40">
                    <div className="text-center">
                      <div className="text-4xl mb-4">PASS</div>
                      <h4 className="text-xl font-rock text-yellow-400 mb-4">SIT THIS ONE OUT?</h4>
                      <p className="text-silver mb-4">
                        Are you sure you want to pass on this question?
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={handlePass}
                          disabled={isSubmitting}
                          className="btn-stage disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="relative w-5 h-5 mr-2 inline-block">
                                <VinylRecord 
                                  className="w-5 h-5" 
                                  animationClass="animate-vinyl-spin"
                                />
                              </div>
                              PASSING...
                            </>
                          ) : (
                            <>
                              YES, PASS
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setIsPassConfirmShowing(false)}
                          className="btn-electric"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => setIsPassConfirmShowing(true)}
                      className="bg-gradient-to-r from-deep-space to-stage-dark text-silver border border-electric-purple/30 hover:border-yellow-600/50 px-6 py-3 rounded-lg font-medium text-sm transition-all hover:text-yellow-400"
                    >
                      Sit this one out
                    </button>
                    <p className="text-xs text-silver mt-2">Not feeling this question? You can pass and wait for the next round</p>
                  </div>
                )}
              </div>
              
              {/* Host controls for ending selection */}
              {isHost && (
                <div className="mt-8 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30">
                  <h4 className="text-lg font-rock text-gold-record mb-4 text-center">MC CONTROLS</h4>
                  <div className="text-center">
                    <button
                      onClick={handleEndSelectionWithCountdown}
                      disabled={isStartingCountdown || game.countdown?.isActive}
                      className="btn-electric disabled:opacity-50 group"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {isStartingCountdown ? (
                          <>
                            <div className="relative w-5 h-5 mr-3">
                              <VinylRecord 
                                className="w-5 h-5" 
                                animationClass="animate-vinyl-spin"
                              />
                            </div>
                            STARTING COUNTDOWN...
                          </>
                        ) : game.countdown?.isActive ? (
                          'COUNTDOWN ACTIVE'
                        ) : (
                          <>
                            END SONG SELECTION
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                    <p className="text-xs text-silver mt-3">
                      Force all non-submitted players to pass on this question
                    </p>
                    {countdownError && (
                      <div className="mt-3 p-3 bg-red-900/50 text-red-200 rounded text-sm">
                        {countdownError}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* General error display */}
              {error && (
                <div className="mt-6 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-4">
                  <div className="flex items-center text-stage-red">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default SelectionScreen;