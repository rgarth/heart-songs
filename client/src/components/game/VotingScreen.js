// client/src/components/game/VotingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { getPlaylist, playTrack, pausePlayback, getTrack } from '../../services/spotifyService';
import { voteForSong } from '../../services/gameService';

const VotingScreen = ({ game, currentUser, accessToken }) => {
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [tracksWithPreviews, setTracksWithPreviews] = useState({});
  const [isPremium, setIsPremium] = useState(false);
  
  // Add state to track if we've already loaded data
  const [dataLoaded, setDataLoaded] = useState(false);
  const [localSubmissions, setLocalSubmissions] = useState([]);
  
  // Use ref to track the current playlist ID to avoid refetching
  const lastPlaylistIdRef = useRef(null);
  
  // Detect if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check if there are active players (from force start)
  const hasActivePlayers = game.activePlayers && game.activePlayers.length > 0;
  
  // Check if this is a small game (less than 3 players)
  const isSmallGame = (hasActivePlayers ? game.activePlayers.length : game.players.length) < 3;
  
  // Update local submissions whenever game.submissions changes
  useEffect(() => {
    if (game.submissions && game.submissions.length > 0) {
      setLocalSubmissions(game.submissions);
    }
  }, [game.submissions]);
  
  // Check if user has already voted - only run once per vote change
  useEffect(() => {
    const userVoted = game.submissions.some(s => 
      s.votes.some(v => v._id === currentUser.id)
    );
    
    if (userVoted) {
      setHasVoted(true);
    }
  }, [game.submissions, currentUser.id]);
  
  // Check user's Spotify subscription type
  useEffect(() => {
    const checkSpotifySubscription = async () => {
      try {
        console.log('Checking Spotify subscription type...');
        
        const response = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('User subscription type:', data.product);
          const isPremiumUser = data.product === 'premium';
          setIsPremium(isPremiumUser);
          console.log('User has premium:', isPremiumUser);
        } else {
          console.error('Failed to fetch user subscription info:', response.statusText);
          // Default to non-premium to be safe
          setIsPremium(false);
        }
      } catch (error) {
        console.error('Error checking Spotify subscription:', error);
        // Default to non-premium to be safe
        setIsPremium(false);
      }
    };
    
    if (accessToken) {
      checkSpotifySubscription();
    }
  }, [accessToken]);
  
  // Load playlist - with improvements to prevent flickering
  useEffect(() => {
    // Skip if we've already loaded this playlist or if there's no playlist
    if (!game.playlistId || game.playlistId === lastPlaylistIdRef.current) {
      return;
    }
    
    const fetchPlaylist = async () => {
      try {
        // Only show loading state on initial load
        if (!dataLoaded) {
          setLoading(true);
        }
        
        // Update our ref to track that we're loading this playlist
        lastPlaylistIdRef.current = game.playlistId;
        
        const playlistData = await getPlaylist(game.playlistId, accessToken);
        setPlaylist(playlistData);
        
        // Fetch preview URLs for all tracks (needed for mobile or free accounts)
        const previewsObj = {};
        
        // Use Promise.all to fetch all track details in parallel
        const trackPromises = game.submissions.map(async (submission) => {
          try {
            const track = await getTrack(submission.songId, accessToken);
            previewsObj[submission.songId] = track.preview_url;
          } catch (error) {
            console.error(`Error fetching track ${submission.songId}:`, error);
          }
        });
        
        await Promise.all(trackPromises);
        setTracksWithPreviews(previewsObj);
        
        // Mark that we've successfully loaded data
        setDataLoaded(true);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError('Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };
    
    if (game.playlistId) {
      fetchPlaylist();
    }
  }, [game.playlistId, accessToken, game.submissions, dataLoaded]);
  
  // Initialize Spotify Web Playback SDK (only on desktop + premium)
  useEffect(() => {
    // Skip SDK initialization on mobile devices or non-premium accounts
    if (isMobile || !isPremium) return;
    
    let spotifyPlayer = null;
    
    const initializePlayer = () => {
      if (!window.Spotify) {
        console.log('Spotify SDK not available yet, loading script...');
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
      } else if (!spotifyPlayer) {
        console.log('Initializing Spotify player...');
        spotifyPlayer = new window.Spotify.Player({
          name: 'Heart Songs Game Player',
          getOAuthToken: cb => { cb(accessToken); }
        });
        
        // Error handling
        spotifyPlayer.addListener('initialization_error', ({ message }) => {
          console.error('Failed to initialize player:', message);
          setPlayerError(`Player initialization failed: ${message}`);
        });
        
        spotifyPlayer.addListener('authentication_error', ({ message }) => {
          console.error('Failed to authenticate:', message);
          setPlayerError(`Authentication failed: ${message}`);
        });
        
        spotifyPlayer.addListener('account_error', ({ message }) => {
          console.error('Account error:', message);
          setPlayerError(`Account error: ${message}`);
        });
        
        spotifyPlayer.addListener('playback_error', ({ message }) => {
          console.error('Playback error:', message);
          setPlayerError(`Playback error: ${message}`);
        });
        
        // Ready
        spotifyPlayer.addListener('ready', ({ device_id }) => {
          console.log('Spotify player ready with Device ID:', device_id);
          setDeviceId(device_id);
          setPlayerReady(true);
          setPlayerError(null);
        });
        
        spotifyPlayer.addListener('not_ready', ({ device_id }) => {
          console.log('Device has gone offline:', device_id);
          setPlayerReady(false);
        });
        
        // Connect
        spotifyPlayer.connect()
          .then(success => {
            if (success) {
              console.log('Spotify player connected successfully');
            } else {
              console.error('Failed to connect Spotify player');
              setPlayerError('Failed to connect player');
            }
          });
        
        setPlayer(spotifyPlayer);
      }
    };

    // Initialize when the component mounts
    initializePlayer();
    
    // Set up the SDK ready callback
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('Spotify Web Playback SDK is ready');
      initializePlayer();
    };
    
    // Cleanup on component unmount
    return () => {
      if (spotifyPlayer) {
        console.log('Disconnecting Spotify player');
        spotifyPlayer.disconnect();
      }
    };
  }, [accessToken, isMobile, isPremium]);
  
  // Clean up audio previews when component unmounts
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        setPreviewAudio(null);
      }
    };
  }, [previewAudio]);
  
  // Handle play track - unified function for desktop and mobile
  const handlePlay = async (trackId) => {
    console.log('Attempting to play track:', trackId, 'Premium:', isPremium, 'Mobile:', isMobile);
    
    // Premium on desktop: Try using Spotify Web Playback SDK first
    if (!isMobile && isPremium && deviceId) {
      try {
        // If this track is already playing, pause it
        if (currentlyPlaying === trackId) {
          console.log('Pausing current track');
          await pausePlayback(accessToken);
          setCurrentlyPlaying(null);
        } else {
          // Play the new track
          console.log('Playing track with device ID:', deviceId);
          const trackUri = `spotify:track:${trackId}`;
          await playTrack(deviceId, trackUri, accessToken);
          setCurrentlyPlaying(trackId);
        }
        setPlayerError(null);
        return; // Return early if successful
      } catch (error) {
        console.error('Error controlling playback:', error);
        // Continue to fallback - don't set error yet
      }
    }
    
    // Fallback for mobile, free accounts, or if SDK playback failed: try previews
    const previewUrl = tracksWithPreviews[trackId];
    
    if (previewUrl) {
      // If an audio is already playing, stop it
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
        setPreviewAudio(null);
        
        // If we're trying to pause the current track, just return
        if (currentlyPlaying === trackId) {
          setCurrentlyPlaying(null);
          return;
        }
      }
      
      const audio = new Audio(previewUrl);
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        setCurrentlyPlaying(null);
        setPreviewAudio(null);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setPlayerError('Failed to play preview. Please try again.');
        setCurrentlyPlaying(null);
        setPreviewAudio(null);
      });
      
      // Play the preview
      audio.play()
        .then(() => {
          setPreviewAudio(audio);
          setCurrentlyPlaying(trackId);
          setPlayerError(null);
        })
        .catch(error => {
          console.error('Error playing preview:', error);
          
          // Handle iOS interaction requirement
          if (error.name === 'NotAllowedError') {
            setPlayerError('Playback requires interaction. Please tap play again.');
            // Keep the audio object ready for user interaction
            setPreviewAudio(audio);
          } else {
            setPlayerError(`Could not play preview: ${error.message}`);
          }
        });
    } else {
      // No preview URL available and SDK didn't work
      setPlayerError(`No preview available for this track. Unfortunately, Spotify doesn't provide a preview for every song.`);
    }
  };
  
  // Handle vote
  const handleVote = async () => {
    if (!selectedSubmission) return;
    
    try {
      setIsVoting(true);
      
      await voteForSong(game._id, currentUser.id, selectedSubmission, accessToken);
      
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };
  
  // Count of voted players
  const votedCount = game.submissions.reduce(
    (acc, sub) => acc + sub.votes.length, 
    0
  );
  const totalPlayers = hasActivePlayers ? game.activePlayers.length : game.players.length;
  
  // Early return when data is still being initially loaded
  if (loading && !dataLoaded) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-center">Voting Time</h2>
          
          <div className="text-center mb-6">
            <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
          </div>
          
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Voting Time</h2>
        
        <div className="text-center mb-6">
          <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm">
            Vote for your favorite answer {isSmallGame ? "" : "(not your own)"}
          </p>
          <p className="text-sm text-gray-400">
            {votedCount} of {totalPlayers} voted
          </p>
        </div>
        
        {/* Player status information */}
        {playerError && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">
            <p><strong>Playback issue:</strong> {playerError}</p>
          </div>
        )}
        
        {isMobile && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Mobile playback:</strong> 30-second previews will play when available.</p>
          </div>
        )}
        
        {!isMobile && !isPremium && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Free account:</strong> 30-second previews will play when available. Upgrade to Spotify Premium for full song playback.</p>
          </div>
        )}
        
        {isSmallGame && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Note:</strong> In games with fewer than 3 players, you can vote for your own submission.</p>
          </div>
        )}
        
        {hasActivePlayers && game.activePlayers.length < game.players.length && (
          <div className="mb-4 p-3 bg-purple-900/50 text-purple-200 rounded-lg text-sm">
            <p><strong>Note:</strong> This round is being played with {game.activePlayers.length} out of {game.players.length} players. Only players who were ready when the game started are participating.</p>
          </div>
        )}
        
        {error ? (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        ) : (
          <div>
            {hasVoted && (
              <div className="mb-6 text-center py-4 bg-green-800/30 rounded-lg">
                <div className="mb-2">
                  <svg className="w-8 h-8 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-400 font-medium">Your vote has been submitted!</p>
                <p className="text-gray-300 text-sm mt-1">You can still listen to all submissions while waiting for others to vote.</p>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium mb-2">All Submissions</h3>
              
              {localSubmissions.map(submission => {
                const isOwnSubmission = submission.player._id === currentUser.id;
                const hasPreview = tracksWithPreviews[submission.songId];
                const noAudioAvailable = !hasPreview && (isMobile || !isPremium || !playerReady);
                
                return (
                  <div 
                    key={submission._id}
                    className={`flex items-center p-4 rounded-lg ${
                      !hasVoted && (!isOwnSubmission || isSmallGame) ? 'cursor-pointer hover:bg-gray-700' : ''
                    } transition-colors ${
                      selectedSubmission === submission._id ? 'bg-gray-700 border border-blue-500' : 'bg-gray-750'
                    } ${
                      isOwnSubmission ? 'border-l-4 border-l-yellow-500' : ''
                    }`}
                  >
                    {submission.albumCover && (
                      <img 
                        src={submission.albumCover} 
                        alt={submission.songName} 
                        className="w-16 h-16 rounded mr-4" 
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium">{submission.songName}</p>
                        {isOwnSubmission && (
                          <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">Your Pick</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{submission.artist}</p>
                    </div>
                    
                    {/* Play/Pause button - always visible for all tracks */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(submission.songId);
                      }}
                      className={`py-2 px-4 rounded transition-colors flex items-center ${
                        currentlyPlaying === submission.songId
                          ? 'bg-green-600 text-white'
                          : noAudioAvailable 
                            ? 'bg-gray-600 text-white opacity-50 cursor-not-allowed'
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                      }`}
                      disabled={noAudioAvailable}
                    >
                      {currentlyPlaying === submission.songId ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                          </svg>
                          Pause
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Play
                          {noAudioAvailable && " (No audio)"}
                          {!noAudioAvailable && isMobile && " (Preview)"}
                          {!noAudioAvailable && !isMobile && !isPremium && " (Preview)"}
                        </>
                      )}
                    </button>
                    
                    {/* Vote button - only for non-voted submissions and only for other submissions in regular games */}
                    {!hasVoted && (isSmallGame || !isOwnSubmission) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(submission._id);
                        }}
                        className={`ml-2 py-2 px-4 rounded ${
                          selectedSubmission === submission._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        {selectedSubmission === submission._id ? 'Selected' : 'Select'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            {!hasVoted && (
              <div className="text-center">
                <button
                  onClick={handleVote}
                  disabled={!selectedSubmission || isVoting}
                  className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
                </button>
                <p className="text-sm text-gray-400 mt-2">
                  Select your favorite song{isSmallGame ? "" : " from another player"}, then submit your vote
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingScreen;