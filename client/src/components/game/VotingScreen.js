// client/src/components/game/VotingScreen.js
import React, { useState, useEffect } from 'react';
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
  
  // Generate YouTube embed URL from track ID (same as FinalResultsScreen)
  const getYouTubeEmbedUrl = (youtubeId) => {
    if (!youtubeId) return null;
    return `https://www.youtube.com/embed/${youtubeId}`;
  };
  
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
                  className={`bg-gray-750 rounded-lg overflow-hidden ${
                    !hasVoted && (!isOwnSubmission || isSmallGame) ? 'cursor-pointer hover:bg-gray-700' : ''
                  } transition-colors ${
                    selectedSubmission === submission._id ? 'border border-blue-500' : ''
                  } ${
                    isOwnSubmission ? 'relative border-t-4 border-t-yellow-500' : ''
                  }`}
                  onClick={() => {
                    if (!hasVoted && (isSmallGame || !isOwnSubmission)) {
                      setSelectedSubmission(submission._id);
                    }
                  }}
                >
                  {isOwnSubmission && (
                    <div className="absolute top-0 left-4 -mt-2 bg-yellow-600 text-white text-xs px-2 py-px rounded">
                      Your Pick
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="w-full">
                      {/* YouTube Player Embed - Updated to match FinalResultsScreen */}
                      {submission.youtubeId ? (
                        <iframe 
                          src={getYouTubeEmbedUrl(submission.youtubeId)}
                          width="100%" 
                          height="300"
                          frameBorder="0" 
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                          title={`${submission.songName} by ${submission.artist}`}
                          className="rounded mb-4"
                        ></iframe>
                      ) : (
                        <div className="bg-gray-700 h-20 rounded flex items-center justify-center mb-4">
                          <p className="text-gray-400 text-sm">No video available</p>
                        </div>
                      )}
                      
                      {/* Song Info and Buttons */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{submission.songName}</p>
                          <p className="text-sm text-gray-400">{submission.artist}</p>
                          <p className="text-xs text-gray-500 mt-1">Submitted by: {submission.player.displayName}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Open in YouTube button */}
                          {submission.youtubeId && (
                            <a 
                              href={`https://www.youtube.com/watch?v=${submission.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="py-2 px-3 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-sm"
                            >
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                              </svg>
                              Watch on YouTube
                            </a>
                          )}
                          
                          {/* Vote button - only for non-voted submissions and only for other submissions in regular games */}
                          {!hasVoted && (isSmallGame || !isOwnSubmission) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSubmission(submission._id);
                              }}
                              className={`py-2 px-4 rounded ${
                                selectedSubmission === submission._id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-600 text-white hover:bg-gray-500'
                              }`}
                            >
                              {selectedSubmission === submission._id ? 'Selected' : 'Select'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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