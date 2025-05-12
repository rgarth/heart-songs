// client/src/components/game/FinalResultsScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addYoutubeDataToTrack } from '../../services/musicService';

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
  
  // Process the winning tracks from each round
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
        
        // Initialize winning tracks list
        let winningTracksList = [];
        
        // Check if we should use tracks from previousRounds
        if (game.previousRounds && Array.isArray(game.previousRounds) && game.previousRounds.length > 0) {
          
          // Process each round to find the winning song
          winningTracksList = game.previousRounds.map((round, index) => {
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
                const votesA = a && a.votes && Array.isArray(a.votes) ? a.votes.length : 0;
                const votesB = b && b.votes && Array.isArray(b.votes) ? b.votes.length : 0;
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
          }).filter(Boolean); // Remove any null entries
          
        }

        // Add current round winner if game is in results or ended state
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
                roundNumber: winningTracksList.length + 1,
                allPassed: true
              };
              
              winningTracksList.push(finalRoundTrack);
            } else {
              // Sort by votes
              const sortedSubmissions = [...actualSubmissions].sort((a, b) => {
                const votesA = a && a.votes && Array.isArray(a.votes) ? a.votes.length : 0;
                const votesB = b && b.votes && Array.isArray(b.votes) ? b.votes.length : 0;
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
                  roundNumber: winningTracksList.length + 1,
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
        
        // Remove any potential duplicates before setting state
        const uniqueTracks = [];
        const seenIds = new Set();
    
        for (const track of winningTracksList) {
          if (!seenIds.has(track.songId)) {
            uniqueTracks.push(track);
            seenIds.add(track.songId);
          }
        }
        
        setWinningTracks(uniqueTracks);
        
        // Now fetch YouTube data for tracks that don't have it and aren't passed rounds
        const tracksNeedingYoutube = uniqueTracks.filter(track => !track.youtubeId && !track.allPassed);
        if (tracksNeedingYoutube.length > 0) {
          await fetchMissingYoutubeDataForTracks(uniqueTracks);
        }
        
      } catch (error) {
        console.error('Error processing winning tracks:', error);
        setError('Failed to process winning songs');
      } finally {
        setLoading(false);
      }
    };
    
    processWinningTracks();
  }, [game]);
  
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
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Game Over</h2>
          <div className="py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading final results...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Game Over</h2>
        
        {/* Winner announcement */}
        <div className="text-center mb-8">
          {isTie ? (
            <div>
              <h3 className="text-xl font-medium text-yellow-400 mb-2">It's a Tie!</h3>
              <p className="text-gray-300">
                {sortedPlayers.filter(p => p.score === winner.score).map(p => p.user.displayName).join(' and ')} 
                tied with {winner.score} points each!
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-medium text-yellow-400 mb-2">
                {isWinner ? 'You Won!' : `${winner?.user?.displayName || 'Someone'} Wins!`}
              </h3>
              <p className="text-gray-300">
                With a total of {winner?.score || 0} points
              </p>
            </div>
          )}
        </div>
        
        {/* Final scoreboard */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Final Scores</h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.user._id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-700/30' : 'bg-gray-700'
                } ${
                  player.user._id === currentUser.id ? 'border border-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <span className="text-lg font-bold mr-3">{index + 1}.</span>
                  {player.user.profileImage && (
                    <img 
                      src={player.user.profileImage} 
                      alt={player.user.displayName} 
                      className="w-8 h-8 rounded-full mr-3" 
                    />
                  )}
                  <p className="font-medium">
                    {player.user.displayName}
                    {player.user._id === currentUser.id && (
                      <span className="ml-1 text-blue-400">(You)</span>
                    )}
                  </p>
                </div>
                <div className="font-bold">{player.score} pts</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* YouTube Playlist Button */}
        {winningTracks.filter(track => track.youtubeId).length > 0 && (
          <div className="mb-8 text-center">
            <button
              onClick={handleOpenPlaylist}
              className="py-3 px-6 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center mx-auto gap-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
              </svg>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 3h20v14H2V3zm2 2v10h8V5H4zm12 0v10h4V5h-4zM4 19h16v2H4v-2z" />
              </svg>
              Play All Winning Songs
            </button>
            <p className="text-sm text-gray-400 mt-2">
              Creates a YouTube playlist with all {winningTracks.filter(track => track.youtubeId).length} winning songs
            </p>
          </div>
        )}
        
        {/* Winning songs from each round with embedded YouTube players */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Winning Songs</h3>
          </div>
          
          {winningTracks.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No winning songs found</p>
          ) : (
            <div className="space-y-6">
              {winningTracks.map((track, index) => {
                if (!track || !track.songId) return null;
                
                const isLoadingYoutube = youtubeLoadingStates[track.songId];
                const isPassedRound = track.allPassed;
                
                return (
                  <div 
                    key={`${track.songId}-${index}`}
                    className="bg-gray-750 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-700 px-4 py-2 font-medium">
                      <p className="text-yellow-400">
                        Round {track.roundNumber}: {track.question?.text || "Question not available"}
                      </p>
                    </div>
                    <div className="p-4">
                      {isPassedRound ? (
                        <div className="bg-gray-700 h-20 rounded flex items-center justify-center mb-4">
                          <div className="flex flex-col items-center text-center">
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-gray-300 font-medium">All players passed on this question</p>
                            <p className="text-gray-400 text-sm mt-1">No winning song for this round</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          {/* YouTube Embed */}
                          {isLoadingYoutube ? (
                            <div className="h-72 bg-gray-600 rounded flex items-center justify-center mb-4">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="text-gray-300 text-sm">Loading audio...</p>
                              </div>
                            </div>
                          ) : track.youtubeId ? (
                            <div className="relative">
                              <iframe
                                src={getYouTubeEmbedUrl(track.youtubeId)}
                                width="100%" 
                                height="300" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                title={`${track.songName || 'Song'} by ${track.artist || 'Artist'}`}
                                className="rounded mb-4"
                              ></iframe>
                              <div className="absolute top-2 right-2 flex gap-2">
                                {track.fromCache && (
                                  <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                    Cached
                                  </div>
                                )}
                                <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                  Audio
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-700 h-20 rounded flex items-center justify-center mb-4">
                              <p className="text-gray-400 text-sm">
                                {track.quotaExhausted ? 'Audio unavailable (quota)' :
                                 track.youtubeLoadError ? 'Audio failed to load' :
                                 'No audio available'}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            {track.albumCover && (
                              <img 
                                src={track.albumCover} 
                                alt={track.songName} 
                                className="w-16 h-16 rounded mr-3" 
                              />
                            )}
                            <div>
                              <p className="font-medium">{track.songName}</p>
                              <p className="text-sm text-gray-400">{track.artist}</p>
                            </div>
                            
                            {track.youtubeId && (
                              <a 
                                href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto py-2 px-3 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-sm"
                              >
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                                </svg>
                                Watch on YouTube
                              </a>
                            )}
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
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}
        
        {/* Return to home button */}
        <div className="text-center">
          <button
            onClick={handleReturnHome}
            className="py-3 px-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Return to Home
          </button>
          
          <p className="text-gray-400 text-sm mt-3">
            Thanks for playing Heart Songs!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinalResultsScreen;