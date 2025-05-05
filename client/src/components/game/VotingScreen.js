// client/src/components/game/VotingScreen.js
import React, { useState, useEffect } from 'react';
import { getSpotifyOpenURL } from '../../services/spotifyService';
import { voteForSong } from '../../services/gameService';

const VotingScreen = ({ game, currentUser, accessToken }) => {
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState(null);
  
  // Add state to track if we've already loaded data
  const [dataLoaded, setDataLoaded] = useState(false);
  const [localSubmissions, setLocalSubmissions] = useState([]);
  
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
  
  // Load submissions only once
  useEffect(() => {
    if (dataLoaded || !game.submissions || game.submissions.length === 0) {
      return;
    }
    
    setLocalSubmissions(game.submissions);
    setDataLoaded(true);
    setLoading(false);
  }, [game.submissions, dataLoaded]);
  
  // Open song in Spotify
  const openInSpotify = (trackId) => {
    // Get both Spotify app URI and web fallback URL
    const spotifyAppUri = `spotify:track:${trackId}`;
    const spotifyWebUrl = `https://open.spotify.com/track/${trackId}`;
    
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Create an invisible iframe to try opening the Spotify app
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = spotifyAppUri;
      document.body.appendChild(iframe);
      
      // Set a timeout to remove the iframe and open the web URL if the app doesn't open
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.location.href = spotifyWebUrl; // Use location.href instead of window.open
      }, 500);
    } else {
      // On desktop, just open in a new tab as before
      window.open(spotifyWebUrl, '_blank');
    }
  };
  
  // Handle vote
  const handleVote = async () => {
    if (!selectedSubmission) return;
    
    try {
      setIsVoting(true);
      setError(null);
      
      // Get the most up-to-date token
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        setError('Authentication token missing. Please refresh the page and try again.');
        setIsVoting(false);
        return;
      }
      
      await voteForSong(game._id, currentUser.id, selectedSubmission, token);
      
      setHasVoted(true);
    } catch (error) {
      console.error('Error voting:', error);
      setError('Failed to submit your vote. Please try again.');
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
        
        <div className="mb-4 p-3 bg-blue-900/50 text-blue-200 rounded-lg text-sm">
          <p><strong>Note:</strong> Click "Open in Spotify" to listen to songs in the Spotify app or web player.</p>
        </div>
        
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
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg text-sm">
            <p><strong>Error:</strong> {error}</p>
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
                You can still listen to all submissions while waiting for others to vote.
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
                  onClick={() => {
                    if (!hasVoted && (isSmallGame || !isOwnSubmission)) {
                      setSelectedSubmission(submission._id);
                    }
                  }}
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
                  
                  {/* "Open in Spotify" button */}
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