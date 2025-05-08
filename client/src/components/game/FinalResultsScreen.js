// client/src/components/game/FinalResultsScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaylistTracks } from '../../services/spotifyService';

const FinalResultsScreen = ({ game, currentUser, accessToken }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [winningTracks, setWinningTracks] = useState([]);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  
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
  
  // Create a shareable link for all songs
  const createSpotifyPlayButton = (trackId) => {
    if (!trackId) {
      // Return a fallback or empty string if no trackId
      return '';
    }
    return `https://open.spotify.com/embed/track/${trackId}`;
  };
  
  // Generate and download M3U playlist file
  const downloadM3UPlaylist = () => {
    try {
      // Create M3U header
      let m3uContent = "#EXTM3U\n";
      
      // Add each song to the playlist
      winningTracks.forEach((track, index) => {
        if (!track || !track.songId) return;
        
        // Add track info line with duration (-1 means unknown duration)
        m3uContent += `#EXTINF:-1,${track.artist || 'Unknown Artist'} - ${track.songName || 'Unknown Song'}\n`;
        
        // Add Spotify URL for the track
        m3uContent += `https://open.spotify.com/track/${track.songId}\n`;
      });
      
      // Create a blob and download link
      const blob = new Blob([m3uContent], { type: 'audio/x-mpegurl' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `heart-songs-${game.gameCode || 'game'}.m3u`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message briefly
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating M3U playlist:', error);
      setError('Failed to create playlist file. Please try again.');
    }
  };
  
  // Load winning tracks directly from server for all users
  useEffect(() => {
    const fetchWinningTracks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Safety checks for game object
        if (!game) {
          setError('Game data is not available');
          setLoading(false);
          return;
        }
        
        console.log('FinalResultsScreen: Getting winning tracks');
        
        // Initialize winning tracks list
        let winningTracksList = [];
        
        // Check if we should use tracks from previousRounds
        if (game.previousRounds && Array.isArray(game.previousRounds) && game.previousRounds.length > 0) {
          console.log(`Found ${game.previousRounds.length} previous rounds to process`);
          
          // Process each round to find the winning song
          winningTracksList = game.previousRounds.map((round, index) => {
            if (!round || !round.submissions || !Array.isArray(round.submissions) || round.submissions.length === 0) {
              return null;
            }
            
            try {
              // Sort submissions by votes
              const sortedSubmissions = [...round.submissions].sort((a, b) => {
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
                roundNumber: index + 1
              };
            } catch (error) {
              console.error(`Error processing round ${index}:`, error);
              return null;
            }
          }).filter(Boolean); // Remove any null entries
          
          console.log(`Processed ${winningTracksList.length} winning songs from previous rounds`);
        }

        // Add current round winner if game is in results or ended state
        if ((game.status === 'results' || game.status === 'ended') && 
            game.submissions && Array.isArray(game.submissions) && game.submissions.length > 0) {
          
          try {
            console.log('Processing current round submissions');
            
            // Sort by votes
            const sortedSubmissions = [...game.submissions].sort((a, b) => {
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
                roundNumber: winningTracksList.length + 1
              };
              
              // Check if this is a duplicate
              const isDuplicate = winningTracksList.some(track => track.songId === currentWinner.songId);
              
              if (!isDuplicate) {
                winningTracksList.push(finalRoundTrack);
                console.log(`Added current round winner: ${currentWinner.songName}`);
              } else {
                console.log(`Current winner is duplicate, not adding: ${currentWinner.songName}`);
              }
            }
          } catch (error) {
            console.error('Error processing current round submissions:', error);
          }
        }
        
        // If we still don't have any winning tracks, try fetching from server as fallback
        if (winningTracksList.length === 0 && game._id) {
          try {
            console.log('No winning tracks found locally, trying server');
            
            const serverTracks = await getPlaylistTracks(game._id, accessToken);
            
            if (Array.isArray(serverTracks) && serverTracks.length > 0) {
              console.log(`Received ${serverTracks.length} tracks from server`);
              
              // Process tracks to ensure consistent naming
              winningTracksList = serverTracks.map((track, index) => ({
                songId: track.trackId || track.songId,
                songName: track.trackName || track.songName || 'Unknown Song',
                artist: track.artistName || track.artist || 'Unknown Artist',
                albumCover: track.albumCover || '',
                question: track.question || null,
                roundNumber: track.roundNumber || (index + 1)
              }));
            } else {
              console.log('No tracks returned from server');
            }
          } catch (error) {
            console.error('Error fetching tracks from server:', error);
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
        
        console.log(`Final winning tracks count: ${uniqueTracks.length}`);
        setWinningTracks(uniqueTracks);
    
      } catch (error) {
        console.error('Error fetching winning tracks:', error);
        setError('Failed to load winning songs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWinningTracks();
  }, [game, accessToken]);

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
                {isWinner ? 'You Won!' : `${winner.user.displayName} Wins!`}
              </h3>
              <p className="text-gray-300">
                With a total of {winner.score} points
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
        
        {/* Winning songs from each round with embedded players */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Winning Songs</h3>
            
            {/* M3U playlist download button */}
            {winningTracks.length > 0 && (
              <div className="flex items-center">
                <button
                  onClick={downloadM3UPlaylist}
                  className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Playlist
                </button>
                
                {downloadSuccess && (
                  <span className="ml-2 text-green-400 text-sm animate-pulse">
                    Playlist downloaded!
                  </span>
                )}
              </div>
            )}
          </div>
          
          {winningTracks.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No winning songs found</p>
          ) : (
            <div className="space-y-6">
              {winningTracks.map((track, index) => {
                if (!track || !track.songId) return null;
                
                return (
                  <div 
                    key={`${track.songId}-${index}`}
                    className="bg-gray-750 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-700 px-4 py-2 font-medium">
                      <p className="text-yellow-400">
                        Round {index + 1}: {track.question?.text || "Question not available"}
                      </p>
                    </div>
                    <div className="p-4">

                      {/* Embedded Spotify player */}
                      <div className="w-full">
                        <iframe
                          src={createSpotifyPlayButton(track.songId)}
                          width="100%" 
                          height="80" 
                          frameBorder="0" 
                          allowtransparency="true" 
                          allow="encrypted-media"
                          title={`${track.songName || 'Song'} by ${track.artist || 'Artist'}`}
                        ></iframe>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Info about M3U playlist */}
        {winningTracks.length > 0 && (
          <div className="mb-8 bg-gray-700 p-4 rounded-lg text-sm">
            <p className="mb-2 text-white font-medium">About the M3U Playlist</p>
            <p className="text-gray-300">
              To import an m3u playlist into spotify, you will need a third party service like <a href="https://soundiiz.com">https://soundiiz.com</a>
            </p>
          </div>
        )}
        
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