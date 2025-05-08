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
  
  // Load winning tracks from each round
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
        
        console.log('FinalResultsScreen loading - Game data:', JSON.stringify({
          has_previous_rounds: !!game.previousRounds,
          previous_rounds_length: game.previousRounds?.length || 0,
          has_final_round_data: !!game.finalRoundData,
          game_status: game.status,
          all_rounds_count: game.allRoundsCount || 0,
          submissions_count: game.submissions?.length || 0
        }));
        
        // Array to hold all winning tracks
        let winningTracksList = [];
        
        // First check if we have previous rounds data
        if (game.previousRounds && Array.isArray(game.previousRounds) && game.previousRounds.length > 0) {
          // Extract winning songs from previous rounds
          winningTracksList = game.previousRounds.map((round, index) => {
            // Skip rounds with missing or invalid data
            if (!round || !round.submissions || !Array.isArray(round.submissions) || round.submissions.length === 0) {
              console.log(`Round ${index} has invalid data:`, round);
              return null;
            }
            
            try {
              // Make a safe copy to avoid mutation errors
              const sortableSubmissions = [...round.submissions];
              
              // Find song with most votes in this round
              const roundWinner = sortableSubmissions.sort((a, b) => {
                // Safely handle potential undefined votes arrays
                const votesA = a && a.votes && Array.isArray(a.votes) ? a.votes.length : 0;
                const votesB = b && b.votes && Array.isArray(b.votes) ? b.votes.length : 0;
                return votesB - votesA;
              })[0];
              
              if (!roundWinner || !roundWinner.songId) {
                console.log(`Round ${index} has no valid winner:`, roundWinner);
                return null;
              }
              
              // Return winning track data
              return {
                songId: roundWinner.songId,
                songName: roundWinner.songName || 'Unknown Song',
                artist: roundWinner.artist || 'Unknown Artist',
                albumCover: roundWinner.albumCover || '',
                player: roundWinner.player || null,
                votes: roundWinner.votes && Array.isArray(roundWinner.votes) ? roundWinner.votes.length : 0,
                question: round.question || null,
                roundNumber: index + 1
              };
            } catch (error) {
              console.error(`Error processing round ${index}:`, error);
              return null;
            }
          }).filter(Boolean); // Filter out null entries
          
          console.log('Found winning tracks from previousRounds:', winningTracksList.length);
        }
        
        // Check if we have a finalRoundData explicit property (from our enhanced Game.js fix)
        if (game.finalRoundData && game.finalRoundData.submissions && game.finalRoundData.submissions.length > 0) {
          try {
            console.log('Found explicit finalRoundData - processing it');
            
            // Get the submissions from finalRoundData
            const finalRoundSubmissions = game.finalRoundData.submissions;
            
            // Winners should already be sorted by votes, but let's make sure
            if (finalRoundSubmissions.length > 0) {
              const finalRoundWinner = finalRoundSubmissions[0]; // First item should be the winner
              
              if (finalRoundWinner && finalRoundWinner.songId) {
                // Create winning track object for final round
                const finalWinnerTrack = {
                  songId: finalRoundWinner.songId,
                  songName: finalRoundWinner.songName || 'Unknown Song',
                  artist: finalRoundWinner.artist || 'Unknown Artist',
                  albumCover: finalRoundWinner.albumCover || '',
                  player: finalRoundWinner.player || null,
                  votes: finalRoundWinner.votes && Array.isArray(finalRoundWinner.votes) ? finalRoundWinner.votes.length : 0,
                  question: game.finalRoundData.question || null,
                  roundNumber: (winningTracksList.length > 0 ? winningTracksList.length + 1 : 1)
                };
                
                // Add to our tracks list if it doesn't appear to be a duplicate
                const isDuplicate = winningTracksList.some(track => 
                  track.songId === finalWinnerTrack.songId && 
                  track.songName === finalWinnerTrack.songName
                );
                
                if (!isDuplicate) {
                  winningTracksList.push(finalWinnerTrack);
                  console.log('Added explicit final round winner:', finalWinnerTrack.songName);
                } else {
                  console.log('Skipping duplicate final round track:', finalWinnerTrack.songName);
                }
              } else {
                console.log('Final round has invalid winner:', finalRoundWinner);
              }
            } else {
              console.log('Final round submissions is empty');
            }
          } catch (error) {
            console.error('Error processing finalRoundData:', error);
          }
        }
        // Otherwise check current submissions if we're still missing data
        else if (game.status === 'ended' && game.submissions && game.submissions.length > 0 &&
                // Only add if we don't already have this round
                (winningTracksList.length < (game.allRoundsCount || 0))) {
          try {
            console.log('Adding winning track from current submissions');
            
            // Sort submissions by votes
            const sortedSubmissions = [...game.submissions].sort((a, b) => {
              const votesA = a && a.votes && Array.isArray(a.votes) ? a.votes.length : 0;
              const votesB = b && b.votes && Array.isArray(b.votes) ? b.votes.length : 0;
              return votesB - votesA;
            });
            
            // Get the winning submission
            const winner = sortedSubmissions[0];
            
            if (winner && winner.songId) {
              // Create a winning track object
              const finalWinner = {
                songId: winner.songId,
                songName: winner.songName || 'Unknown Song',
                artist: winner.artist || 'Unknown Artist',
                albumCover: winner.albumCover || '',
                player: winner.player || null,
                votes: winner.votes && Array.isArray(winner.votes) ? winner.votes.length : 0,
                question: game.currentQuestion || null,
                roundNumber: (winningTracksList.length > 0 ? winningTracksList.length + 1 : 1)
              };
              
              // Check if this appears to be a duplicate
              const isDuplicate = winningTracksList.some(track => 
                track.songId === finalWinner.songId && 
                track.songName === finalWinner.songName
              );
              
              if (!isDuplicate) {
                winningTracksList.push(finalWinner);
                console.log('Added winner from current submissions');
              } else {
                console.log('Skipping duplicate current submission');
              }
            } else {
              console.log('Current submissions has invalid winner:', winner);
            }
          } catch (error) {
            console.error('Error processing current submissions:', error);
          }
        }
        
        // If we still have no tracks, try the server playlist as a last resort
        if (winningTracksList.length === 0 && game._id) {
          try {
            console.log('No tracks found locally, trying server playlist');
            
            // Fallback: try to get playlist from server
            const playlistTracks = await getPlaylistTracks(game._id, accessToken);
            if (Array.isArray(playlistTracks) && playlistTracks.length > 0) {
              console.log('Fetched playlist tracks from server:', playlistTracks.length);
              winningTracksList = playlistTracks.map((track, index) => ({
                ...track,
                roundNumber: index + 1
              }));
            } else {
              console.log('Server returned no playlist tracks');
              setWinningTracks([]);
            }
          } catch (error) {
            console.error('Error fetching playlist tracks:', error);
            setWinningTracks([]);
          }
        }
        
        // Update state with our collected winning tracks
        console.log('Final winning tracks count:', winningTracksList.length);
        setWinningTracks(winningTracksList);
        
      } catch (error) {
        console.error('Error fetching winning tracks:', error);
        setError('Failed to load winning songs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWinningTracks();
  }, [game, accessToken]);
  
  // Simplified fix for missing/duplicate rounds
  useEffect(() => {
    // Calculate correct number of rounds
    // For games with 2 rounds total, we should expect 2 tracks
    const expectedRounds = (game.previousRounds?.length || 0);
    
    console.log(`Verifying correct rounds - winningTracks: ${winningTracks.length}, expectedRounds: ${expectedRounds}`);
    
    // First fix case: too few tracks
    if (winningTracks.length < expectedRounds && game.submissions?.length > 0) {
      console.log(`Missing track detected - adding final round's winning song`);
      
      try {
        // Get the winning song from the current submissions
        const sortedSubmissions = [...game.submissions].sort((a, b) => {
          return (b.votes?.length || 0) - (a.votes?.length || 0);
        });
        
        if (sortedSubmissions.length > 0) {
          const winner = sortedSubmissions[0];
          
          // Check if it's already in the list
          const isDuplicate = winningTracks.some(track => 
            track.songId === winner.songId
          );
          
          if (!isDuplicate) {
            const finalTrack = {
              songId: winner.songId,
              songName: winner.songName,
              artist: winner.artist,
              albumCover: winner.albumCover,
              question: game.currentQuestion,
              roundNumber: winningTracks.length + 1
            };
            
            console.log(`Adding missing song: ${winner.songName}`);
            setWinningTracks(prev => [...prev, finalTrack]);
          }
        }
      } catch (err) {
        console.error("Error fixing missing round:", err);
      }
    }
    
    // Second fix case: too many tracks
    if (winningTracks.length > expectedRounds && expectedRounds > 0) {
      console.log(`Too many tracks detected - have ${winningTracks.length}, expected ${expectedRounds}`);
      
      // Just take the correct number of tracks
      const limitedTracks = winningTracks.slice(0, expectedRounds);
      console.log(`Limiting tracks from ${winningTracks.length} to ${limitedTracks.length}`);
      setWinningTracks(limitedTracks);
    }
  }, [game.previousRounds?.length, game.submissions, game.currentQuestion, winningTracks.length]);

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