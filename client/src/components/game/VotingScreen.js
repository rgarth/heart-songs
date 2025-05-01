// client/src/components/game/VotingScreen.js
import React, { useState, useEffect } from 'react';
import { getPlaylist, playTrack } from '../../services/spotifyService';
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
  
  // NEW FEATURE: Check if this is a small game (less than 3 players)
  const isSmallGame = game.players.length < 3;
  
  // Check if user has already voted
  useEffect(() => {
    const userVoted = game.submissions.some(s => 
      s.votes.some(v => v._id === currentUser.id)
    );
    
    if (userVoted) {
      setHasVoted(true);
    }
  }, [game.submissions, currentUser.id]);
  
  // Load playlist
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const playlistData = await getPlaylist(game.playlistId, accessToken);
        setPlaylist(playlistData);
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
  }, [game.playlistId, accessToken]);
  
  // Initialize Spotify Web Playback SDK
  useEffect(() => {
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
  }, [accessToken]);
  
  // Handle play track
  const handlePlay = async (trackId) => {
    console.log('Attempting to play track:', trackId);
    
    if (!deviceId) {
      console.error('No device ID available');
      setPlayerError('No playback device available. Make sure Spotify is open and you are logged in.');
      return;
    }
    
    try {
      console.log('Playing track with device ID:', deviceId);
      const trackUri = `spotify:track:${trackId}`;
      await playTrack(deviceId, trackUri, accessToken);
      setCurrentlyPlaying(trackId);
      setPlayerError(null);
    } catch (error) {
      console.error('Error playing track:', error);
      setPlayerError(`Failed to play track: ${error.message}`);
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
  const totalPlayers = game.players.length;
  
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
            <p className="mt-1">Try opening Spotify in another tab first, then try again.</p>
          </div>
        )}
        
        {isSmallGame && (
          <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
            <p><strong>Note:</strong> In games with fewer than 3 players, you can vote for your own submission.</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading submissions...</p>
          </div>
        ) : error ? (
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
              
              {game.submissions.map(submission => {
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
                    
                    {/* Play button - always visible for all tracks */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlay(submission.songId);
                      }}
                      className={`py-2 px-4 rounded transition-colors ${
                        currentlyPlaying === submission.songId
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white hover:bg-gray-500'
                      }`}
                    >
                      {currentlyPlaying === submission.songId ? 'Playing' : 'Play'}
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