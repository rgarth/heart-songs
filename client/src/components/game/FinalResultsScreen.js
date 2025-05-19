// client/src/components/game/FinalResultsScreen.js - YouTube Compliant Version
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addYoutubeDataToTrack } from '../../services/musicService';
import VinylRecord from '../VinylRecord';

// Simple SVG Crown component - classic crown silhouette
const CrownIcon = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17H21V20H3V17Z" />
    <path d="M12 4L17 10L21 8L19 16H5L3 8L7 10L12 4Z" />
  </svg>
);

const FinalResultsScreen = ({ game, currentUser, accessToken }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [winningTracks, setWinningTracks] = useState([]);
  const [youtubeLoadingStates, setYoutubeLoadingStates] = useState({});
  
  // Add safety checks for undefined or empty arrays
  const hasPlayers = game && game.players && Array.isArray(game.players) && game.players.length > 0;
  
  // Sort players by score (highest first)
  const sortedPlayers = hasPlayers ? [...game.players].sort((a, b) => b.score - a.score) : [];
  
  // Determine the winner (player with highest score)
  const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
  
  // Check if current user is the winner
  const isWinner = winner && winner.user && currentUser && winner.user._id === currentUser.id;
  
  // Check if there's a tie for first place
  const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;

//process winning tracks
useEffect(() => {
  const processWinningTracks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Safety checks for game object
      if (!game) {
        setError('Game data is not available');
        setLoading(false);
        return;
      }
      
      console.log("Processing game data:", {
        status: game.status,
        hasGameId: !!game._id,
        hasPreviousRounds: Array.isArray(game.previousRounds),
        previousRoundsLength: Array.isArray(game.previousRounds) ? game.previousRounds.length : 'N/A',
        gameId: game._id
      });
      
      // Initialize winning tracks list
      let winningTracksList = [];
      
      // IMPROVED LOCALSTORAGE HANDLING: First, try to get previous rounds from localStorage if they're missing
      if ((!game.previousRounds || !Array.isArray(game.previousRounds) || game.previousRounds.length === 0) 
          && game.status === 'ended' && game._id) {
        
        try {
          // Log key being used to help with debugging
          const storageKey = `gameHistory_${game._id}`;
          console.log(`Trying to load game history from localStorage with key: ${storageKey}`);
          
          // Try to load game history from localStorage
          const savedGameHistory = localStorage.getItem(storageKey);
          
          if (savedGameHistory) {
            console.log(`Found saved game history in localStorage, parsing...`);
            const parsedHistory = JSON.parse(savedGameHistory);
            
            console.log("Parsed history details:", {
              hasPreviousRounds: !!parsedHistory?.previousRounds,
              isArray: Array.isArray(parsedHistory?.previousRounds),
              length: Array.isArray(parsedHistory?.previousRounds) ? parsedHistory.previousRounds.length : 'N/A',
              savedAt: parsedHistory?.savedAt,
              gameId: parsedHistory?.gameId
            });
            
            if (parsedHistory && 
                parsedHistory.previousRounds && 
                Array.isArray(parsedHistory.previousRounds) && 
                parsedHistory.previousRounds.length > 0) {
              
              console.log(`Loaded ${parsedHistory.previousRounds.length} rounds from localStorage`);
              
              // Use the previousRounds from localStorage
              game.previousRounds = parsedHistory.previousRounds;
            } else {
              console.warn(`Found game history in localStorage but it doesn't contain valid previousRounds`);
            }
          } else {
            console.warn(`No game history found in localStorage with key: ${storageKey}`);
            
            // Try an alternative approach - maybe the key format was different
            // Search for any key that might contain this game's history
            let foundAlternativeHistory = false;
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.includes('gameHistory_')) {
                console.log(`Found potential game history key: ${key}`);
                try {
                  const data = JSON.parse(localStorage.getItem(key));
                  if (data && data.gameId === game._id) {
                    console.log(`Found matching game history under key: ${key}`);
                    game.previousRounds = data.previousRounds;
                    foundAlternativeHistory = true;
                    break;
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
            
            if (!foundAlternativeHistory) {
              console.warn(`No alternative game history found in localStorage`);
            }
          }
        } catch (localStorageError) {
          console.error('Error loading game history from localStorage:', localStorageError);
        }
      }
      
      // Now process previous rounds with the localStorage enhancement
      if (game.previousRounds && Array.isArray(game.previousRounds) && game.previousRounds.length > 0) {
        console.log(`Processing ${game.previousRounds.length} previous rounds`);
        
        // Process each round to find the winning song
        winningTracksList = game.previousRounds
          .map((round, index) => {
            if (!round || !round.submissions || !Array.isArray(round.submissions) || round.submissions.length === 0) {
              return null;
            }
            
            try {
              // Filter out passed submissions
              const actualSubmissions = round.submissions.filter(s => !s.hasPassed);
              
              // If no actual submissions, record that all passed
              if (actualSubmissions.length === 0) {
                return {
                  songId: `ALL_PASSED_${index}`,
                  songName: 'All players passed',
                  artist: '',
                  albumCover: '',
                  question: round.question || null,
                  roundNumber: index + 1,
                  allPassed: true
                };
              }
              
              // Sort actual submissions by votes
              const sortedSubmissions = [...actualSubmissions].sort((a, b) => {
                const votesA = a.votes?.length || 0;
                const votesB = b.votes?.length || 0;
                return votesB - votesA;
              });
              
              // Get the winning submission (most votes)
              const winner = sortedSubmissions[0];
              
              if (!winner || !winner.songId) {
                return null;
              }
              
              return {
                songId: winner.songId,
                songName: winner.songName || 'Unknown Song',
                artist: winner.artist || 'Unknown Artist',
                albumCover: winner.albumCover || '',
                question: round.question || null,
                roundNumber: index + 1,
                // Include any YouTube data that was already fetched
                youtubeId: winner.youtubeId || null,
                preferredType: 'audio' // Default to audio if not specified
              };
            } catch (error) {
              console.error(`Error processing round ${index}:`, error);
              return null;
            }
          })
          .filter(Boolean); // Remove any null entries
      } else {
        console.warn(`No previous rounds available to process (length: ${game.previousRounds?.length || 0})`);
      }
      
      // Add current round winner if game is in results or ended state
      const finalRoundNumber = winningTracksList.length + 1;
      
      if ((game.status === 'results' || game.status === 'ended') && 
          game.submissions && Array.isArray(game.submissions) && game.submissions.length > 0) {
        
        try {
          // Filter out passed submissions
          const actualSubmissions = game.submissions.filter(s => !s.hasPassed);
          
          if (actualSubmissions.length === 0) {
            // All players passed on this round
            const finalRoundTrack = {
              songId: 'ALL_PASSED_FINAL',
              songName: 'All players passed',
              artist: '',
              albumCover: '',
              question: game.currentQuestion || null,
              roundNumber: finalRoundNumber,
              allPassed: true
            };
            
            winningTracksList.push(finalRoundTrack);
          } else {
            // Sort by votes
            const sortedSubmissions = [...actualSubmissions].sort((a, b) => {
              const votesA = a.votes?.length || 0;
              const votesB = b.votes?.length || 0;
              return votesB - votesA;
            });
            
            // Get the current winner
            const currentWinner = sortedSubmissions[0];
            
            if (currentWinner && currentWinner.songId) {
              const finalRoundTrack = {
                songId: currentWinner.songId,
                songName: currentWinner.songName || 'Unknown Song',
                artist: currentWinner.artist || 'Unknown Artist',
                albumCover: currentWinner.albumCover || '',
                question: game.currentQuestion || null,
                roundNumber: finalRoundNumber,
                // Include any YouTube data that was already fetched
                youtubeId: currentWinner.youtubeId || null,
                preferredType: 'audio' // Default to audio
              };
              
              // Check if this is a duplicate
              const isDuplicate = winningTracksList.some(track => track.songId === currentWinner.songId);
              
              if (!isDuplicate) {
                winningTracksList.push(finalRoundTrack);
              }
            }
          }
        } catch (error) {
          console.error('Error processing current round submissions:', error);
        }
      }
      
      // Log the final list for debugging
      console.log(`Processed ${winningTracksList.length} winning tracks`);
      
      // Update state with all winning tracks
      setWinningTracks(winningTracksList);
      
      // Now fetch YouTube data for tracks that don't have it and aren't passed rounds
      const tracksNeedingYoutube = winningTracksList.filter(track => !track.youtubeId && !track.allPassed);
      if (tracksNeedingYoutube.length > 0) {
        await fetchMissingYoutubeDataForTracks(winningTracksList);
      }
      
    } catch (error) {
      console.error('Error processing winning tracks:', error);
      setError('Failed to process winning songs');
    } finally {
      setLoading(false);
    }
  };
  
  processWinningTracks();
}, [game]); // Keep game as the sole dependency to ensure we re-run when any part of game changes

  // Fetch YouTube data only for tracks that don't have it
  const fetchMissingYoutubeDataForTracks = async (tracks) => {
    // Filter for tracks that need YouTube data (excluding passed rounds)
    const tracksNeedingData = tracks.filter(track => !track.youtubeId && !track.allPassed);
    
    if (tracksNeedingData.length === 0) {
      // All tracks already have YouTube data
      return;
    }
    
    // Copy all tracks
    const tracksWithYoutube = [...tracks];
    
    // Set loading states
    const loadingStates = {};
    tracksNeedingData.forEach(track => {
      loadingStates[track.songId] = true;
    });
    setYoutubeLoadingStates(loadingStates);
    
    // Fetch YouTube data only for missing tracks
    await Promise.all(tracksNeedingData.map(async (track) => {
      try {
        // Find the track in our main array
        const trackIndex = tracksWithYoutube.findIndex(t => t.songId === track.songId);
        
        // Fetch as audio by default (matches original submission)
        const trackWithYoutube = await addYoutubeDataToTrack({
          id: track.songId,
          name: track.songName,
          artist: track.artist,
          albumArt: track.albumCover
        }, false); // Always use audio preference for final results
        
        // Update the track with YouTube data
        if (trackIndex !== -1) {
          tracksWithYoutube[trackIndex] = {
            ...tracksWithYoutube[trackIndex],
            youtubeId: trackWithYoutube.youtubeId,
            youtubeTitle: trackWithYoutube.youtubeTitle,
            quotaExhausted: trackWithYoutube.quotaExhausted,
            fromCache: trackWithYoutube.fromCache,
            isVideo: trackWithYoutube.isVideo || false,
            preferredType: 'audio'
          };
        }
        
      } catch (error) {
        console.error(`Error loading YouTube for ${track.songName}:`, error);
        
        // Find and mark as failed to load
        const trackIndex = tracksWithYoutube.findIndex(t => t.songId === track.songId);
        if (trackIndex !== -1) {
          tracksWithYoutube[trackIndex] = {
            ...tracksWithYoutube[trackIndex],
            youtubeLoadError: true
          };
        }
      } finally {
        // Remove loading state
        setYoutubeLoadingStates(prev => {
          const newState = { ...prev };
          delete newState[track.songId];
          return newState;
        });
      }
    }));
    
    // Update state with all YouTube data
    setWinningTracks(tracksWithYoutube);
    
  };

  // Generate YouTube embed URL
  const getYouTubeEmbedUrl = (youtubeId) => {
    if (!youtubeId) return null;
    return `https://www.youtube.com/embed/${youtubeId}`;
  };

  // Generate YouTube playlist URL that queues songs properly
  const getYouTubePlaylistUrl = () => {
    // Filter tracks with valid YouTube IDs
    const videosWithIds = winningTracks.filter(track => track.youtubeId);
    
    if (videosWithIds.length === 0) return null;
    
    // Create a playlist URL using the watch_videos feature
    const videoIds = videosWithIds.map(track => track.youtubeId);
    
    // YouTube's watch_videos format: watch?v=FIRST_ID&list=WLFIRST_ID,SECOND_ID,THIRD_ID
    const playlistUrl = `https://www.youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
    
    return playlistUrl;
  };

  // Handle playlist opening
  const handleOpenPlaylist = () => {
    const videosWithIds = winningTracks.filter(track => track.youtubeId);
    
    if (videosWithIds.length === 0) {
      alert('No videos available to create a playlist');
      return;
    }
    
    // Get the proper playlist URL
    const playlistUrl = getYouTubePlaylistUrl();
    
    // Open in new tab
    window.open(playlistUrl, '_blank');
  };

  // Return to home
  const handleReturnHome = () => {
    navigate('/');
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
          
          {/* Stage header with concert finale styling */}
          <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
            <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
              GAME OVER
            </h2>
            <p className="text-silver text-center mt-2">Preparing final results...</p>
          </div>
          
          <div className="py-12 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="mr-4">
                <VinylRecord 
                  className="w-20 h-20"
                  animationClass="animate-vinyl-spin"
                />
              </div>
              <div className="equalizer">
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>
            </div>
            <p className="text-silver text-lg">Loading final results...</p>
            <p className="text-turquoise text-sm mt-2">Compiling highlights</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main results card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-8 border-b border-electric-purple/30 relative overflow-hidden">
          {/* Stage lights effect */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-electric-purple/10 rounded-full -translate-y-16 blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-neon-pink/10 rounded-full -translate-y-16 blur-3xl"></div>
          <div className="absolute top-0 left-1/2 w-32 h-32 bg-gold-record/10 rounded-full -translate-y-16 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-4">
              GAME OVER
            </h2>
            <p className="text-silver text-center text-lg">Final Results</p>
          </div>
        </div>
        
        <div className="p-8">
          
          {/* Winner announcement */}
          <div className="text-center mb-10">
            <div className="w-full">
              {/* Spotlight effect */}
              <div className="absolute -inset-8 bg-gold-record/10 rounded-full blur-3xl"></div>
              
              {isTie ? (
                <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-8 border-l-4 border-gold-record shadow-2xl w-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="mr-4">
                      <CrownIcon className="h-12 w-12 text-gold-record" />
                    </div>
                    <div className="ml-4">
                      <CrownIcon className="h-12 w-12 text-gold-record" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-rock text-center mb-3">
                    <span className="neon-text bg-gradient-to-r from-gold-record to-yellow-400 bg-clip-text text-transparent">
                      IT'S A TIE!
                    </span>
                  </h3>
                  <p className="text-silver text-lg text-center">
                    <span className="text-white font-bold">
                      {sortedPlayers.filter(p => p.score === winner.score).map(p => p.user.displayName).join(' & ')}
                    </span>
                    <br />
                    <span className="text-gold-record font-bold text-xl">tied with {winner.score} points each!</span>
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-8 border-l-4 border-gold-record shadow-2xl w-full">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <VinylRecord 
                        className="w-20 h-20"
                        animationClass="animate-vinyl-spin"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute -top-6">
                          <CrownIcon className="h-10 w-10 text-gold-record" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-rock text-center mb-3">
                    {isWinner ? (
                      <span className="neon-text bg-gradient-to-r from-gold-record to-yellow-400 bg-clip-text text-transparent">
                        YOU WIN!
                      </span>
                    ) : (
                      <span className="neon-text bg-gradient-to-r from-gold-record to-yellow-400 bg-clip-text text-transparent">
                        {winner?.user?.displayName || 'Champion'} WINS!
                      </span>
                    )}
                  </h3>
                  <p className="text-silver text-lg text-center">
                    <span className="text-gold-record font-bold text-2xl">{winner?.score || 0} points</span>
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Final leaderboard */}
          <div className="mb-10">
            <h3 className="text-2xl font-rock text-center mb-6">
              LEADERBOARD
            </h3>
            
            <div className="space-y-4">
              {sortedPlayers.map((player, index) => {
                const isCurrentUser = player.user._id === currentUser.id;
                const isTopThree = index < 3;
                const position = index + 1;
                
                // Position styling
                const getPositionStyle = () => {
                  if (position === 1) return 'from-gold-record/30 to-yellow-400/30 border-gold-record/60';
                  if (position === 2) return 'from-silver/30 to-gray-300/30 border-silver/60';
                  if (position === 3) return 'from-amber-600/30 to-orange-500/30 border-amber-600/60';
                  return 'from-stage-dark to-vinyl-black border-electric-purple/30';
                };
                
                const getPositionIcon = () => {
                  if (position === 1) return <CrownIcon className="h-6 w-6 text-gold-record" />;
                  if (position === 2) return '2';
                  if (position === 3) return '3';
                  return position;
                };
                
                return (
                  <div 
                    key={player.user._id}
                    className={`
                      bg-gradient-to-r ${getPositionStyle()} rounded-lg p-6 border transition-all
                      ${isCurrentUser ? 'ring-2 ring-neon-pink shadow-neon-pink/30 shadow-lg' : ''}
                      ${isTopThree ? 'transform hover:scale-[1.02] hover:shadow-xl' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {/* Position indicator */}
                        <div className={`
                          w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl mr-6
                          ${position === 1 ? 'bg-gold-record text-vinyl-black' : 
                            position === 2 ? 'bg-silver text-vinyl-black' : 
                            position === 3 ? 'bg-amber-600 text-white' : 
                            'bg-electric-purple text-white'}
                        `}>
                          {getPositionIcon()}
                        </div>
                        
                        {/* Player avatar and info */}
                        <div className="flex items-center">
                          {player.user.profileImage && (
                            <div className="relative mr-4">
                              <img 
                                src={player.user.profileImage} 
                                alt={player.user.displayName} 
                                className={`w-16 h-16 rounded-full border-3 ${
                                  position === 1 ? 'border-gold-record' : 
                                  position === 2 ? 'border-silver' : 
                                  position === 3 ? 'border-amber-600' : 
                                  'border-electric-purple'
                                }`}
                              />
                            </div>
                          )}
                          
                          <div>
                            <p className="font-bold text-white text-xl font-rock">
                              #{position} {player.user.displayName}
                              {isCurrentUser && (
                                <span className="ml-3 text-neon-pink font-medium">(YOU)</span>
                              )}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className="text-silver text-sm">Total points</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Score display */}
                      <div className="text-right">
                        <div className={`text-4xl font-bold font-rock ${
                          position === 1 ? 'text-gold-record' : 
                          position === 2 ? 'text-silver' : 
                          position === 3 ? 'text-amber-600' : 
                          'text-white'
                        }`}>
                          {player.score}
                        </div>
                        <div className="text-xs text-silver uppercase tracking-wider">POINTS</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Greatest hits collection */}
          {winningTracks.filter(track => track.youtubeId).length > 0 && (
            <div className="mb-10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-rock text-center mb-3">
                  WINNING SONG COLLECTION
                </h3>
                <p className="text-silver">Listen to all the winning songs from each round</p>
              </div>
              
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30 text-center">
                <button
                  onClick={handleOpenPlaylist}
                  className="btn-electric group relative overflow-hidden mb-4"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    <svg className="h-6 w-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                    </svg>
                    <svg className="h-6 w-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2 3h20v14H2V3zm2 2v10h8V5H4zm12 0v10h4V5h-4zM4 19h16v2H4v-2z" />
                    </svg>
                    <span className="text-lg font-bold">PLAY ALL SONGS</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                <p className="text-silver text-sm">
                  <span className="text-neon-pink font-semibold">{winningTracks.filter(track => track.youtubeId).length}</span> winning songs • Auto-queued playlist
                </p>
              </div>
            </div>
          )}
          
          {/* Winning songs showcase */}
          <div className="mb-10">
            <h3 className="text-2xl font-rock text-center mb-6">
              ROUND WINNERS
            </h3>
            
            {winningTracks.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4">
                  <VinylRecord 
                    className="w-24 h-24 mx-auto opacity-50"
                    animationClass=""
                  />
                </div>
                <p className="text-silver text-lg">No winning songs found</p>
                <p className="text-silver/60 text-sm">No rounds were completed</p>
              </div>
            ) : (
              <div className="space-y-8">
                {winningTracks.map((track, index) => {
                  if (!track || !track.songId) return null;
                  
                  const isLoadingYoutube = youtubeLoadingStates[track.songId];
                  const isPassedRound = track.allPassed;
                  
                  return (
                    <div 
                      key={`${track.songId}-${index}`}
                      className="bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg overflow-hidden border border-electric-purple/30"
                    >
                      {/* Round header */}
                      <div className="px-6 py-4 border-b bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 border-electric-purple/30">
                        <div className="flex flex-col">
                          <h4 className="text-lg font-bold text-gold-record mb-2">
                            Round #{track.roundNumber}
                          </h4>
                          <p className="text-neon-pink text-lg font-medium">
                            {track.question?.text || "Question not available"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {isPassedRound ? (
                          /* All passed round display */
                          <div className="text-center py-8">
                            <div className="inline-block bg-stage-dark/50 rounded-full p-6 mb-4">
                              <svg className="w-16 h-16 text-silver mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h5 className="text-xl font-rock text-silver mb-2">NO ENTRIES</h5>
                            <p className="text-silver">All players passed on this round</p>
                            <p className="text-silver/60 text-sm mt-2">No winning song for this round</p>
                          </div>
                        ) : (
                          /* Track with media display */
                          <div className="space-y-6">
                            {/* YouTube Media Section - no overlays per ToS */}
                            {isLoadingYoutube ? (
                              <div className="h-72 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg flex items-center justify-center border border-electric-purple/20">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center mb-4">
                                    <div className="mr-4">
                                      <VinylRecord 
                                        className="w-12 h-12"
                                        animationClass="animate-spin-slow"
                                      />
                                    </div>
                                    <div className="equalizer">
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                    </div>
                                  </div>
                                  <p className="text-silver text-lg">Loading audio...</p>
                                  </div>
                              </div>
                            ) : track.youtubeId ? (
                              <div className="youtube-container">
                                <iframe 
                                  src={getYouTubeEmbedUrl(track.youtubeId)}
                                  frameBorder="0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                                  title={`${track.songName} by ${track.artist}`}
                                ></iframe>
                              </div>
                            ) : (
                              <div className="h-72 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg flex items-center justify-center border border-silver/20">
                                <div className="flex flex-col items-center text-center">
                                  <div className="mb-4">
                                    <VinylRecord 
                                      className="w-20 h-20 opacity-50"
                                      animationClass=""
                                    />
                                  </div>
                                  <p className="text-silver text-lg">
                                    {track.quotaExhausted ? 'Audio unavailable (quota)' : 
                                     track.youtubeLoadError ? 'Audio failed to load' :
                                     'No audio available'}
                                  </p>
                                  <p className="text-silver/60 text-sm mt-1">Unable to load media for this song</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Track Info Card */}
                            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border border-electric-purple/30">
                              <div className="flex items-center">
                                {track.albumCover && (
                                  <div className="mr-4 flex-shrink-0">
                                    <img 
                                      src={track.albumCover} 
                                      alt={track.songName} 
                                      className="w-20 h-20 rounded-lg border-2 border-gold-record shadow-lg" 
                                    />
                                  </div>
                                )}
                                <div>
                                  <h5 className="font-bold text-white text-2xl font-rock">{track.songName}</h5>
                                  <p className="text-silver text-lg font-medium">{track.artist}</p>
                                  <div className="flex items-center mt-2">
                                    <span className="text-neon-pink text-sm">Round {track.roundNumber} Winner</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mb-8 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-4">
              <div className="flex items-center text-stage-red">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Return to home button */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-8 border border-electric-purple/30">
              <h4 className="text-xl font-rock text-neon-pink mb-4">PLAY AGAIN?</h4>
              <p className="text-silver mb-6">
                Ready for another game?
              </p>
              
              <button
                onClick={handleReturnHome}
                className="btn-gold group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="text-xl font-bold">BACK TO HOME</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 border-t border-electric-purple/20">
          <div className="h-2 bg-gradient-to-r from-electric-purple via-neon-pink via-turquoise via-lime-green to-gold-record opacity-75"></div>
          <div className="p-4 text-center">
            <div className="flex justify-center items-center space-x-4 text-silver/40">
              <span className="text-xs font-medium">Game Over</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalResultsScreen;