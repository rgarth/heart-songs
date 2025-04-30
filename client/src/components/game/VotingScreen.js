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
    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
      
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Song Game Player',
          getOAuthToken: cb => { cb(accessToken); }
        });
        
        // Error handling
        player.addListener('initialization_error', ({ message }) => {
          console.error('Failed to initialize player:', message);
        });
        
        player.addListener('authentication_error', ({ message }) => {
          console.error('Failed to authenticate:', message);
        });
        
        player.addListener('account_error', ({ message }) => {
          console.error('Account error:', message);
        });
        
        player.addListener('playback_error', ({ message }) => {
          console.error('Playback error:', message);
        });
        
        // Ready
        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
        });
        
        // Connect
        player.connect();
        setPlayer(player);
      };
    }
    
    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [accessToken]);
  
  // Handle play track
  const handlePlay = async (trackId) => {
    if (!deviceId) return;
    
    try {
      const trackUri = `spotify:track:${trackId}`;
      await playTrack(deviceId, trackUri, accessToken);
      setCurrentlyPlaying(trackId);
    } catch (error) {
      console.error('Error playing track:', error);
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
            Vote for your favorite answer (not your own)
          </p>
          <p className="text-sm text-gray-400">
            {votedCount} of {totalPlayers} voted
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading playlist...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">
            {error}
          </div>
        ) : hasVoted ? (
          <div className="text-center py-10">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-green-500 mb-2">Vote Submitted!</h3>
            <p className="text-gray-300">Waiting for other players to vote...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {game.submissions.map(submission => {
                // Don't show user's own submission for voting
                if (submission.player._id === currentUser.id) return null;
                
                return (
                  <div 
                    key={submission._id}
                    className={`flex items-center p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors ${
                      selectedSubmission === submission._id ? 'bg-gray-700 border border-blue-500' : 'bg-gray-750'
                    }`}
                    onClick={() => setSelectedSubmission(submission._id)}
                  >
                    {submission.albumCover && (
                      <img 
                        src={submission.albumCover} 
                        alt={submission.songName} 
                        className="w-16 h-16 rounded mr-4" 
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{submission.songName}</p>
                      <p className="text-sm text-gray-400">{submission.artist}</p>
                    </div>
                    {deviceId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlay(submission.songId);
                        }}
                        className={`py-2 px-4 rounded ${
                          currentlyPlaying === submission.songId
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        {currentlyPlaying === submission.songId ? 'Playing' : 'Play'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-center">
              <button
                onClick={handleVote}
                disabled={!selectedSubmission || isVoting}
                className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isVoting ? 'Submitting Vote...' : 'Submit Vote'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VotingScreen;