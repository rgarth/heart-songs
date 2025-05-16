// client/src/components/game/FinalResultsScreen.js - ROCKSTAR CONCERT THEME EDITION
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
  
  // Loading state - ROCKSTAR THEMED
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
          
          {/* Stage header with concert finale styling */}
          <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
            <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
              🏆 CONCERT FINALE 🏆
            </h2>
            <p className="text-silver text-center mt-2">The show must go on...</p>
          </div>
          
          <div className="py-12 text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="vinyl-record w-20 h-20 animate-spin mr-4">
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🎭</div>
              </div>
              <div className="equalizer">
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>
            </div>
            <p className="text-silver text-lg">Preparing the grand finale...</p>
            <p className="text-turquoise text-sm mt-2">Loading your greatest hits collection</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Main concert finale card */}
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        
        {/* Concert finale header */}
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-8 border-b border-electric-purple/30 relative overflow-hidden">
          {/* Stage lights effect */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-electric-purple/10 rounded-full -translate-y-16 blur-3xl"></div>
          <div className="absolute top-0 right-1/4 w-32 h-32 bg-neon-pink/10 rounded-full -translate-y-16 blur-3xl"></div>
          <div className="absolute top-0 left-1/2 w-32 h-32 bg-gold-record/10 rounded-full -translate-y-16 -translate-x-1/2 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-4">
              🎸 CONCERT'S END 🎸
            </h2>
            <p className="text-silver text-center text-lg">The curtain falls, but the music lives on!</p>
          </div>
        </div>
        
        <div className="p-8">
          
          {/* Winner announcement - Rock concert style */}
          <div className="text-center mb-10">
            <div className="relative inline-block">
              {/* Spotlight effect */}
              <div className="absolute -inset-8 bg-gold-record/10 rounded-full blur-3xl animate-pulse"></div>
              
              <div className="relative">
                {isTie ? (
                  <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-8 border-l-4 border-gold-record shadow-2xl">
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-6xl mr-4">🏆</div>
                      <div className="text-6xl ml-4">🏆</div>
                    </div>
                    <h3 className="text-3xl font-rock text-center mb-3">
                      <span className="neon-text bg-gradient-to-r from-gold-record to-yellow-400 bg-clip-text text-transparent">
                        🎭 IT'S A ROCK-OFF TIE! 🎭
                      </span>
                    </h3>
                    <p className="text-silver text-lg text-center">
                      <span className="text-white font-bold">
                        {sortedPlayers.filter(p => p.score === winner.score).map(p => p.user.displayName).join(' & ')}
                      </span>
                      <br />
                      <span className="text-gold-record font-bold text-xl">tied with {winner.score} points each!</span>
                    </p>
                    <div className="mt-4 flex justify-center">
                      <div className="equalizer">
                        <div className="equalizer-bar"></div>
                        <div className="equalizer-bar"></div>
                        <div className="equalizer-bar"></div>
                        <div className="equalizer-bar"></div>
                        <div className="equalizer-bar"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-8 border-l-4 border-gold-record shadow-2xl">
                    <div className="flex items-center justify-center mb-4">
                      <div className="vinyl-record w-20 h-20 animate-vinyl-spin">
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">👑</div>
                      </div>
                    </div>
                    <h3 className="text-3xl font-rock text-center mb-3">
                      {isWinner ? (
                        <span className="neon-text bg-gradient-to-r from-gold-record to-yellow-400 bg-clip-text text-transparent">
                          🎤 YOU ARE THE ROCK STAR! 🎤
                        </span>
                      ) : (
                        <span className="neon-text bg-gradient-to-r from-gold-record to-yellow-400 bg-clip-text text-transparent">
                          🏆 {winner?.user?.displayName || 'Champion'} ROCKS THE STAGE! 🏆
                        </span>
                      )}
                    </h3>
                    <p className="text-silver text-lg text-center">
                      <span className="text-gold-record font-bold text-2xl">{winner?.score || 0} points</span>
                      <br />
                      <span className="text-turquoise">The crowd goes wild!</span>
                    </p>
                    {isWinner && (
                      <div className="mt-4 bg-gradient-to-r from-gold-record/20 to-yellow-400/20 rounded-lg p-4 border border-gold-record/40">
                        <p className="text-gold-record font-semibold text-center">
                          🌟 Congratulations! You've conquered the stage! 🌟
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Final leaderboard - Concert hall of fame */}
          <div className="mb-10">
            <h3 className="text-2xl font-rock text-center mb-6 flex items-center justify-center">
              <span className="mr-3">🏅</span>
              HALL OF FAME
              <span className="ml-3">🏅</span>
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
                  if (position === 1) return '👑';
                  if (position === 2) return '🥈';
                  if (position === 3) return '🥉';
                  return '🎵';
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
                              {position === 1 && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold-record rounded-full flex items-center justify-center animate-pulse">
                                  <span className="text-vinyl-black text-lg">✨</span>
                                </div>
                              )}
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
                              <span className="text-silver text-sm">Total performance points</span>
                              {position <= 3 && (
                                <div className="ml-3 flex">
                                  {[...Array(3)].map((_, i) => (
                                    <span key={i} className="text-yellow-500 text-lg animate-bounce" style={{animationDelay: `${i * 0.2}s`}}>
                                      ⭐
                                    </span>
                                  ))}
                                </div>
                              )}
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
                <h3 className="text-2xl font-rock text-center mb-3 flex items-center justify-center">
                  <span className="mr-3">🎵</span>
                  GREATEST HITS COLLECTION
                  <span className="ml-3">🎵</span>
                </h3>
                <p className="text-silver">Listen to all the winning performances from tonight's show</p>
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
                    <span className="text-lg font-bold">PLAY GREATEST HITS</span>
                    <span className="ml-3">🎸</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                <p className="text-silver text-sm">
                  <span className="text-neon-pink font-semibold">{winningTracks.filter(track => track.youtubeId).length}</span> winning songs • Auto-queued playlist
                </p>
                
                <div className="mt-4 flex justify-center">
                  <div className="equalizer">
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Winning songs showcase - Album wall display */}
          <div className="mb-10">
            <h3 className="text-2xl font-rock text-center mb-6 flex items-center justify-center">
              <span className="mr-3">🏆</span>
              ROUND CHAMPIONS
              <span className="ml-3">🏆</span>
            </h3>
            
            {winningTracks.length === 0 ? (
              <div className="text-center py-8">
                <div className="vinyl-record w-24 h-24 mx-auto mb-4 opacity-50">
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🎭</div>
                </div>
                <p className="text-silver text-lg">No winning songs found</p>
                <p className="text-silver/60 text-sm">Must have been a quiet night at the concert hall</p>
              </div>
            ) : (
              <div className="space-y-8">
                {winningTracks.map((track, index) => {
                  if (!track || !track.songId) return null;
                  
                  const isLoadingYoutube = youtubeLoadingStates[track.songId];
                  const isPassedRound = track.allPassed;
                  const isRoundChampion = !isPassedRound;
                  
                  return (
                    <div 
                      key={`${track.songId}-${index}`}
                      className={`bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg overflow-hidden border ${
                        isRoundChampion ? 'border-gold-record/50 shadow-lg shadow-gold-record/20' : 'border-electric-purple/30'
                      }`}
                    >
                      {/* Round header */}
                      <div className={`px-6 py-4 border-b ${
                        isRoundChampion ? 'bg-gradient-to-r from-gold-record/10 to-yellow-400/10 border-gold-record/30' : 'bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 border-electric-purple/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">
                              {isRoundChampion ? '🏆' : '🎭'}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-gold-record">
                                Set #{track.roundNumber}
                              </h4>
                              <p className="text-silver text-sm">
                                {track.question?.text || "Question not available"}
                              </p>
                            </div>
                          </div>
                          {isRoundChampion && (
                            <div className="bg-gold-record/20 px-3 py-1 rounded-full border border-gold-record/40">
                              <span className="text-gold-record text-sm font-bold">CROWD FAVORITE</span>
                            </div>
                          )}
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
                            <h5 className="text-xl font-rock text-silver mb-2">🎭 EMPTY STAGE 🎭</h5>
                            <p className="text-silver">All band members passed on this challenge</p>
                            <p className="text-silver/60 text-sm mt-2">No winning song for this set</p>
                          </div>
                        ) : (
                          /* Track with media display */
                          <div className="space-y-6">
                            {/* YouTube Media Section */}
                            {isLoadingYoutube ? (
                              <div className="h-72 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg flex items-center justify-center border border-electric-purple/20">
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center mb-4">
                                    <div className="vinyl-record w-12 h-12 animate-spin mr-4"></div>
                                    <div className="equalizer">
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                      <div className="equalizer-bar"></div>
                                    </div>
                                  </div>
                                  <p className="text-silver text-lg">Loading the hit song...</p>
                                </div>
                              </div>
                            ) : track.youtubeId ? (
                              <div className="relative">
                                <iframe
                                  src={getYouTubeEmbedUrl(track.youtubeId)}
                                  width="100%" 
                                  height="350"
                                  frameBorder="0" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                  allowFullScreen
                                  title={`${track.songName || 'Song'} by ${track.artist || 'Artist'}`}
                                  className="rounded-lg shadow-lg"
                                ></iframe>
                                
                                {/* Media badges */}
                                <div className="absolute top-3 right-3 flex gap-2">
                                  {track.fromCache && (
                                    <div className="bg-lime-green/90 text-vinyl-black text-xs px-3 py-1 rounded-full font-bold">
                                      🟢 CACHED
                                    </div>
                                  )}
                                  <div className="bg-electric-purple/90 text-white text-xs px-3 py-1 rounded-full font-bold">
                                    🎵 AUDIO VERSION
                                  </div>
                                </div>
                                
                                {/* Champion badge overlay */}
                                <div className="absolute top-3 left-3">
                                  <div className="bg-gold-record/90 text-vinyl-black px-3 py-1 rounded-full font-bold flex items-center">
                                    <span className="mr-1">👑</span>
                                    <span>ROUND WINNER</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="h-72 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg flex items-center justify-center border border-silver/20">
                                <div className="flex flex-col items-center text-center">
                                  <div className="vinyl-record w-20 h-20 mb-4 opacity-50">
                                    <div className="absolute inset-0 flex items-center justify-center text-2xl">🚫</div>
                                  </div>
                                  <p className="text-silver text-lg">
                                    {track.quotaExhausted ? 'Audio unavailable (quota)' : 
                                     track.youtubeLoadError ? 'Audio failed to load' :
                                     'No audio available'}
                                  </p>
                                  <p className="text-silver/60 text-sm mt-1">But it was still the crowd favorite!</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Track Info Card */}
                            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border border-gold-record/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {track.albumCover && (
                                    <div className="relative mr-4 flex-shrink-0">
                                      <img 
                                        src={track.albumCover} 
                                        alt={track.songName} 
                                        className="w-20 h-20 rounded-lg border-2 border-gold-record shadow-lg" 
                                      />
                                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold-record rounded-full flex items-center justify-center animate-pulse">
                                        <span className="text-vinyl-black font-bold text-lg">♪</span>
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <h5 className="font-bold text-white text-2xl font-rock">{track.songName}</h5>
                                    <p className="text-silver text-lg font-medium">{track.artist}</p>
                                    <div className="flex items-center mt-2">
                                      <span className="text-neon-pink text-sm">🏆 Round Champion • </span>
                                      <span className="text-gold-record font-bold">Crowd's Choice</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* YouTube link button */}
                                {track.youtubeId && (
                                  <a 
                                    href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-electric group relative overflow-hidden"
                                  >
                                    <span className="relative z-10 flex items-center">
                                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                                      </svg>
                                      WATCH ON YOUTUBE
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                                  </a>
                                )}
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
                  <p className="font-semibold">Concert Issue</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Return to venue button */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-8 border border-electric-purple/30">
              <h4 className="text-xl font-rock text-neon-pink mb-4">🎸 ENCORE? 🎸</h4>
              <p className="text-silver mb-6">
                Thanks for rocking with us tonight! Ready for another show?
              </p>
              
              <button
                onClick={handleReturnHome}
                className="btn-gold group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="mr-3">🏠</span>
                  <span className="text-xl font-bold">BACK TO THE VENUE</span>
                  <span className="ml-3">🏠</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
              
              <p className="text-silver/60 text-sm mt-4 flex items-center justify-center">
                <span className="mr-2">🎤</span>
                <span>Until next time, keep rocking!</span>
                <span className="ml-2">🎤</span>
              </p>
              
              {/* Final musical note decoration */}
              <div className="mt-6 flex justify-center items-center gap-4">
                <span className="text-electric-purple text-2xl animate-bounce">♪</span>
                <span className="text-neon-pink text-3xl animate-bounce" style={{animationDelay: '0.2s'}}>♫</span>
                <span className="text-turquoise text-2xl animate-bounce" style={{animationDelay: '0.4s'}}>♪</span>
                <span className="text-lime-green text-3xl animate-bounce" style={{animationDelay: '0.6s'}}>♫</span>
                <span className="text-gold-record text-2xl animate-bounce" style={{animationDelay: '0.8s'}}>♪</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Concert footer - Stage lights */}
        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 border-t border-electric-purple/20">
          <div className="h-2 bg-gradient-to-r from-electric-purple via-neon-pink via-turquoise via-lime-green to-gold-record opacity-75"></div>
          <div className="p-4 text-center">
            <div className="flex justify-center items-center space-x-4 text-silver/40">
              <span className="animate-bounce">♪</span>
              <span className="text-xs font-medium">That's a wrap! Rock on! 🤘</span>
              <span className="animate-bounce" style={{animationDelay: '0.5s'}}>♫</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating musical notes decoration */}
      <div className="absolute top-10 right-10 w-16 h-16 bg-electric-purple/20 rounded-full animate-bounce opacity-60" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-10 left-10 w-12 h-12 bg-neon-pink/20 rounded-full animate-bounce opacity-60" style={{animationDelay: '2s'}}></div>
      <div className="absolute top-1/2 right-5 w-8 h-8 bg-gold-record/30 rounded-full animate-bounce opacity-80" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
};

export default FinalResultsScreen;
                