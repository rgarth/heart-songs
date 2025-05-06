// client/src/components/game/FinalResultsScreen.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaylistTracks } from '../../services/spotifyService';

const FinalResultsScreen = ({ game, currentUser, accessToken }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [winningTracks, setWinningTracks] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Sort players by score (highest first)
  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  
  // Determine the winner (player with highest score)
  const winner = sortedPlayers.length > 0 ? sortedPlayers[0] : null;
  
  // Check if current user is the winner
  const isWinner = winner && winner.user._id === currentUser.id;
  
  // Check if there's a tie for first place
  const isTie = sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score;
  
  // Load winning tracks from each round
  useEffect(() => {
    const fetchWinningTracks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If we have previous rounds data in the game state
        if (game.previousRounds && game.previousRounds.length > 0) {
          // Extract winning songs from previous rounds
          const winningTracksList = game.previousRounds.map(round => {
            // Find song with most votes in this round
            const roundWinner = [...round.submissions].sort(
              (a, b) => b.votes.length - a.votes.length
            )[0];
            
            return roundWinner ? {
              songId: roundWinner.songId,
              songName: roundWinner.songName,
              artist: roundWinner.artist,
              albumCover: roundWinner.albumCover,
              player: roundWinner.player,
              votes: roundWinner.votes.length,
              question: round.question
            } : null;
          }).filter(Boolean);
          
          setWinningTracks(winningTracksList);
        } else {
          // Fallback: try to get playlist from server
          const playlistTracks = await getPlaylistTracks(game._id, accessToken);
          setWinningTracks(playlistTracks);
        }
      } catch (error) {
        console.error('Error fetching winning tracks:', error);
        setError('Failed to load winning songs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWinningTracks();
  }, [game, accessToken]);
  
  // Generate Spotify playlist export file
  const handleExportPlaylist = () => {
    try {
      setExportLoading(true);
      
      // Create a better playlist content format for Spotify import
      // This format is more compatible with tools like Soundiiz
      const playlistContent = {
        name: `Heart Songs - ${game.gameCode}`,
        description: `Songs from our Heart Songs game (${game.gameCode}) on ${new Date().toLocaleDateString()}`,
        tracks: []
      };

      // Add all winning songs - either from previousRounds or current submissions
      let tracksToExport = [];
      
      // Use previousRounds if available
      if (game.previousRounds && game.previousRounds.length > 0) {
        tracksToExport = game.previousRounds.map(round => {
          // Find song with most votes in this round
          const roundWinner = [...round.submissions].sort(
            (a, b) => b.votes.length - a.votes.length
          )[0];
          
          return roundWinner ? {
            songId: roundWinner.songId,
            songName: roundWinner.songName,
            artist: roundWinner.artist,
            question: round.question?.text || "Question not available"
          } : null;
        }).filter(Boolean);
      } 
      // If we also have the current round's winning song, add it
      if (game.submissions && game.submissions.length > 0) {
        const currentRoundWinner = [...game.submissions].sort(
          (a, b) => b.votes.length - a.votes.length
        )[0];
        
        if (currentRoundWinner) {
            tracksToExport.push({
            songId: currentRoundWinner.songId,
            songName: currentRoundWinner.songName,
            artist: currentRoundWinner.artist,
            question: game.currentQuestion?.text || "Question not available"
          });
        }
      }
    
      // Add tracks to playlist content
      if (tracksToExport.length > 0) {
        playlistContent.tracks = tracksToExport.map(track => ({
          uri: `spotify:track:${track.songId}`,
          name: track.songName,
          artist: track.artist,
          note: track.question
        }));
      } else if (winningTracks.length > 0) {
        // Fallback to winningTracks if no other source
        playlistContent.tracks = winningTracks.map(track => ({
          uri: `spotify:track:${track.songId}`,
          name: track.songName,
          artist: track.artist
        }));
      }
      
        // Convert to JSON with nice formatting
        const jsonContent = JSON.stringify(playlistContent, null, 2);
      
        // Create a blob and download link
        const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
    
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `heart-songs-${game.gameCode}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting playlist:', error);
      setError('Failed to export playlist');
    } finally {
      setExportLoading(false);
    }
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
        
        {/* Winning songs from each round */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Winning Songs</h3>
          
          {winningTracks.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No winning songs found</p>
          ) : (
            <div className="space-y-4">
              {winningTracks.map((track, index) => (
                <div 
                  key={`${track.songId}-${index}`}
                  className="bg-gray-750 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-700 px-4 py-2 font-medium">
                    <p className="text-yellow-400">
                      Round {index + 1}: {track.question?.text || "Question not available"}
                    </p>
                  </div>
                  <div className="flex items-center p-4">
                    {track.albumCover && (
                      <img 
                        src={track.albumCover} 
                        alt={track.songName} 
                        className="w-16 h-16 rounded mr-4" 
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{track.songName}</p>
                      <p className="text-sm text-gray-400">{track.artist}</p>
                      {track.player && (
                        <p className="text-sm mt-1">
                          Selected by: <span className="font-medium">
                            {typeof track.player === 'object' 
                              ? track.player.displayName 
                              : 'Unknown Player'}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="text-center">
                      <a 
                        href={`https://open.spotify.com/track/${track.songId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>
                        Open
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Export playlist button */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Export Playlist</h3>
          <div className="bg-gray-750 p-4 rounded-lg">
            <p className="text-gray-300 mb-4">
              Want to listen to these songs later? Export the playlist and import it into Spotify.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <button
                onClick={handleExportPlaylist}
                disabled={exportLoading || winningTracks.length === 0}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                    Export Spotify Playlist
                  </>
                )}
              </button>
              
              {exportSuccess && (
                <span className="text-green-400 animate-pulse">
                  Playlist exported successfully!
                </span>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p className="mb-2">How to import into Spotify:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Download the playlist file</li>
                <li>Go to <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">open.spotify.com</a></li>
                <li>Create a new playlist</li>
                <li>Use a tool like <a href="https://soundiiz.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Soundiiz</a> to import your playlist file</li>
              </ol>
            </div>
          </div>
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