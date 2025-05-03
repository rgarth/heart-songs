// client/src/components/game/VotingScreen.js
import React, { useState, useEffect } from 'react';
import { playTrack, pausePlayback } from '../../services/spotifyService';
import { voteForSong } from '../../services/gameService';

const VotingScreen = ({ game, currentUser, accessToken }) => {
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  
  // Add state to track if we've already loaded data
  const [dataLoaded, setDataLoaded] = useState(false);
  const [localSubmissions, setLocalSubmissions] = useState([]);
  
  // Detect if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
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
  
  // Load submissions only once
  useEffect(() => {
    if (dataLoaded || !game.submissions || game.submissions.length === 0) {
      return;
    }
    
    setLocalSubmissions(game.submissions);
    setDataLoaded(true);
    setLoading(false);
  }, [game.submissions, dataLoaded]);
  
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
  
  // Handle play track (for premium desktop users only)
  const handlePlay = async (trackId) => {
    console.log('Attempting to play track:', trackId);
    
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
    } catch (error) {
      console.error('Error controlling playback:', error);
      setPlayerError('Failed to control playback. Please try again.');
    }
  };
  
  // Open song in Spotify app (for mobile users)
  const openInSpotify = (trackId) => {
    const spotifyUri = `spotify:track:${trackId}`;
    window.location.href = spotifyUri;
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
        {playerError && !isMobile && isPremium && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">
            <p><strong>Playback issue:</strong> {playerError}</p>
          </div>
        )}
        
        {isMobile && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Mobile device:</strong> Tap "Open in Spotify" to listen to songs.</p>
          </div>
        )}
        
        {!isMobile && !isPremium && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Spotify Free account:</strong> Playback is not available. Upgrade to Premium to listen to songs during voting.</p>
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
        
        <div>
          {hasVoted && (
            <div className="mb-6 text-center py-4 bg-green-800/30 rounded-lg">
              <div className="mb-2">
                <svg className="w-8 h-8 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-400 font-medium">Your vote has been submitted!</p>
              <p className="text-gray-300 text-sm mt-1">
                {!isMobile && isPremium ? 
                  "You can still listen to all submissions while waiting for others to vote." :
                  "Waiting for others to vote..."}
              </p>
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium mb-2">All Submissions</h3>
            
            {localSubmissions.map(submission => {
              const isOwnSubmission = submission.player._id === currentUser.id;
              
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
                  
                  {/* Playback controls based on device/account type */}
                  {/* For Premium Desktop users: Play/Pause button */}
                  {!isMobile && isPremium && playerReady && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(submission.songId);
                      }}
                      className={`py-2 px-4 rounded transition-colors flex items-center ${
                        currentlyPlaying === submission.songId
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white hover:bg-gray-500'
                      }`}
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
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* For Mobile users: "Open in Spotify" button */}
                  {isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInSpotify(submission.songId);
                      }}
                      className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in Spotify
                    </button>
                  )}
                  
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
      </div>
    </div>
  );
};

export default VotingScreen;