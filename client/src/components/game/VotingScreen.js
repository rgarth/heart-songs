// client/src/components/game/VotingScreen.js - Updated with server-side countdown
import React, { useState, useEffect, useCallback } from 'react';
import { voteForSong, startEndVotingCountdown } from '../../services/gameService';
import { addYoutubeDataToTrack } from '../../services/musicService';
import VideoPreferenceToggle from './VideoPreferenceToggle';

const VotingScreen = ({ game, currentUser, accessToken }) => {
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState(null);
  const [preferVideo, setPreferVideo] = useState(false); // Default to audio
  
  // State for submissions with YouTube data
  const [localSubmissions, setLocalSubmissions] = useState([]);
  const [youtubeLoadingStates, setYoutubeLoadingStates] = useState({});
  
  // NEW: Server countdown state
  const [isStartingCountdown, setIsStartingCountdown] = useState(false);
  const [countdownError, setCountdownError] = useState(null);
  
  // Check if there are active players (from force start)
  const hasActivePlayers = game.activePlayers && game.activePlayers.length > 0;
  
  // Check if this is a small game (less than 3 players)
  const isSmallGame = (hasActivePlayers ? game.activePlayers.length : game.players.length) < 3;
  
  // Check if any submission has quota exhausted flag
  const hasQuotaIssue = localSubmissions.some(s => s.quotaExhausted);
  
  // Filter out passed submissions for voting
  const votableSubmissions = localSubmissions.filter(s => !s.hasPassed);
  
  // Count passed submissions
  const passedCount = localSubmissions.filter(s => s.hasPassed).length;
  
  // Check if current user is the host
  const isHost = game.host._id === currentUser.id;
  
  // Check if user has already voted
  useEffect(() => {
    const userVoted = game.submissions.some(s => 
      s.votes.some(v => v._id === currentUser.id)
    );
    
    if (userVoted) {
      setHasVoted(true);
    }
  }, [game.submissions, currentUser.id]);
  
  // Wrap loadSubmissionsWithPreference in useCallback to stabilize its reference
  const loadSubmissionsWithPreference = useCallback(async () => {
    if (!game.submissions || game.submissions.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Start with the submissions as-is
      const submissionsWithYoutube = [...game.submissions];
      setLocalSubmissions(submissionsWithYoutube);
      
      console.log(`Checking cache for ${submissionsWithYoutube.length} songs (${preferVideo ? 'video' : 'audio'} preference)...`);
      
      // Set loading states only for non-passed submissions
      const loadingStates = {};
      
      submissionsWithYoutube.forEach(submission => {
        if (!submission.hasPassed) {
          loadingStates[submission._id] = true;
        }
      });
      
      setYoutubeLoadingStates(loadingStates);
      
      // Fetch YouTube data for each non-passed submission
      await Promise.all(submissionsWithYoutube.map(async (submission, index) => {
        // Skip passed submissions
        if (submission.hasPassed) {
          return;
        }
        
        try {
          // This will check cache with the specified preference and fetch if needed
          const trackWithYoutube = await addYoutubeDataToTrack({
            id: submission.songId,
            name: submission.songName,
            artist: submission.artist,
            albumArt: submission.albumCover
          }, preferVideo);
          
          // Update the submission with YouTube data
          submissionsWithYoutube[index] = {
            ...submission,
            youtubeId: trackWithYoutube.youtubeId,
            youtubeTitle: trackWithYoutube.youtubeTitle,
            quotaExhausted: trackWithYoutube.quotaExhausted,
            fromCache: trackWithYoutube.fromCache,
            isVideo: trackWithYoutube.isVideo,
            preferredType: trackWithYoutube.preferredType
          };
          
          // Log cache performance
          if (trackWithYoutube.fromCache) {
            console.log(`[CACHE HIT] ${submission.songName} - ${submission.artist} (${preferVideo ? 'video' : 'audio'})`);
          } else {
            console.log(`[NEW FETCH] ${submission.songName} - ${submission.artist} (${preferVideo ? 'video' : 'audio'})`);
          }
          
        } catch (error) {
          console.error(`Error loading YouTube for ${submission.songName}:`, error);
          
          // Mark as failed to load
          submissionsWithYoutube[index] = {
            ...submission,
            youtubeLoadError: true
          };
        } finally {
          // Remove loading state
          setYoutubeLoadingStates(prev => {
            const newState = { ...prev };
            delete newState[submission._id];
            return newState;
          });
        }
      }));
      
      // Update state with all YouTube data
      setLocalSubmissions(submissionsWithYoutube);
      
      // Log cache performance summary
      const cachedCount = submissionsWithYoutube.filter(s => s.fromCache).length;
      const newFetchCount = submissionsWithYoutube.filter(s => !s.fromCache && s.youtubeId).length;
      const totalCount = submissionsWithYoutube.filter(s => !s.hasPassed).length;
      
      console.log(`[DUAL CACHE PERFORMANCE]`);
      console.log(`- Found in cache: ${cachedCount}/${totalCount}`);
      console.log(`- New API fetches: ${newFetchCount}/${totalCount}`);
      console.log(`- Preference: ${preferVideo ? 'video' : 'audio'}`);
      
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load video data. You can still vote!');
    } finally {
      setLoading(false);
    }
  }, [game.submissions, preferVideo]);

  // Load submissions - fetch YouTube data based on user preference
  useEffect(() => {
    loadSubmissionsWithPreference();
  }, [loadSubmissionsWithPreference]); // Now loadSubmissionsWithPreference is in the dependency array

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
  
  // NEW: Handle end voting with server countdown
  const handleEndVotingWithCountdown = async () => {
    if (!isHost) return;
    
    try {
      setIsStartingCountdown(true);
      setCountdownError(null);
      
      // Start the server-side countdown
      await startEndVotingCountdown(game._id, accessToken);
      
      // The countdown banner will appear for all players via the server state
    } catch (error) {
      console.error('Error starting end voting countdown:', error);
      setCountdownError('Failed to start countdown. Please try again.');
    } finally {
      setIsStartingCountdown(false);
    }
  };
  
  // Count of voted players
  const votedCount = game.submissions.reduce(
    (acc, sub) => acc + sub.votes.length, 
    0
  );
  const totalPlayers = hasActivePlayers ? game.activePlayers.length : game.players.length;
  
  // Generate YouTube embed URL
  const getYouTubeEmbedUrl = (youtubeId) => {
    if (!youtubeId) return null;
    return `https://www.youtube.com/embed/${youtubeId}`;
  };
  
  // Check if there are no votable submissions (everyone passed)
  const allPassed = votableSubmissions.length === 0;
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-center">Voting Time</h2>
          
          <div className="text-center mb-6">
            <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
          </div>
          
          <div className="text-center py-10">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading songs in {preferVideo ? 'video' : 'audio'} format...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If everyone passed, show a message
  if (allPassed) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2 text-center">Voting Time</h2>
          
          <div className="text-center mb-6">
            <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
          </div>
          
          <div className="text-center py-10">
            <div className="mb-4">
              <svg className="w-16 h-16 text-gray-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-400 mb-2">Everyone Passed</h3>
            <p className="text-gray-300 mb-4">
              All players passed on this question. Moving to the next round...
            </p>
            <div className="bg-gray-700 p-4 rounded-lg inline-block">
              <p className="text-sm text-gray-400">
                {passedCount} player{passedCount !== 1 ? 's' : ''} passed on this question
              </p>
            </div>
          </div>
          
          {/* Host controls for ending voting when everyone passed */}
          {isHost && (
            <div className="mt-6 pt-4 border-t border-gray-700 text-center">
              <p className="text-sm text-gray-400 mb-3">Host Controls:</p>
              <button
                onClick={handleEndVotingWithCountdown}
                disabled={isStartingCountdown || game.countdown?.isActive}
                className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isStartingCountdown ? 'Starting Countdown...' : 
                 game.countdown?.isActive ? 'Countdown Active' : 
                 'End Voting Phase'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Force all non-voted players to abstain
              </p>
              {countdownError && (
                <div className="mt-2 p-2 bg-red-900/50 text-red-200 rounded text-sm">
                  {countdownError}
                </div>
              )}
            </div>
          )}
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
        
        {/* Video Preference Toggle - only show if there are votable submissions */}
        {votableSubmissions.length > 0 && (
          <div className="flex justify-center mb-6">
            <VideoPreferenceToggle
              preferVideo={preferVideo}
              onToggle={() => setPreferVideo(!preferVideo)}
              disabled={loading}
              showLabel={true}
            />
          </div>
        )}
        
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm">
            Vote for your favorite answer {isSmallGame ? "" : "(not your own)"}
          </p>
          <p className="text-sm text-gray-400">
            {votedCount} of {totalPlayers} voted
          </p>
        </div>
        
        {/* Pass Information */}
        {passedCount > 0 && (
          <div className="mb-4 p-3 bg-gray-750 rounded-lg text-sm">
            <p className="text-gray-300">
              <strong>Note:</strong> {passedCount} player{passedCount !== 1 ? 's' : ''} passed on this question.
            </p>
          </div>
        )}
        
        {/* YouTube Quota Warning */}
        {hasQuotaIssue && (
          <div className="mb-4 p-3 bg-yellow-900/50 text-yellow-200 rounded-lg text-sm">
            <p><strong>Note:</strong> YouTube video embeds are temporarily unavailable due to daily quota limits. You can still vote and the videos will be available again tomorrow.</p>
          </div>
        )}
        
        {/* Cache Performance Info */}
        {votableSubmissions.length > 0 && (
          <div className="mb-4 p-3 bg-green-900/50 text-green-200 rounded-lg text-sm">
            <p><strong>Cache Performance:</strong> {localSubmissions.filter(s => s.fromCache).length}/{votableSubmissions.length} songs loaded from cache!</p>
            <p className="text-xs mt-1">
              Showing {preferVideo ? 'video' : 'audio'} versions - Toggle above to switch
            </p>
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
              
              {/* Host controls when user has voted */}
              {isHost && (
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-400 mb-3">Host Controls:</p>
                  <button
                    onClick={handleEndVotingWithCountdown}
                    disabled={isStartingCountdown || game.countdown?.isActive}
                    className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isStartingCountdown ? 'Starting Countdown...' : 
                     game.countdown?.isActive ? 'Countdown Active' : 
                     'End Voting Phase'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Force all non-voted players to abstain
                  </p>
                  {countdownError && (
                    <div className="mt-2 p-2 bg-red-900/50 text-red-200 rounded text-sm">
                      {countdownError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium mb-2">All Submissions</h3>
            
            {localSubmissions.map(submission => {
              const isOwnSubmission = submission.player._id === currentUser.id;
              const isLoadingYoutube = youtubeLoadingStates[submission._id];
              const isPassed = submission.hasPassed;
              
              // Don't show passed submissions in the list (they're just informational above)
              if (isPassed) {
                return null;
              }
              
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
                      {/* YouTube Player Embed */}
                      {isLoadingYoutube ? (
                        <div className="h-72 bg-gray-700 rounded flex items-center justify-center mb-4">
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p className="text-gray-300 text-sm">Loading {preferVideo ? 'video' : 'audio'}...</p>
                          </div>
                        </div>
                      ) : submission.youtubeId ? (
                        <div className="relative">
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
                          <div className="absolute top-2 right-2 flex gap-2">
                            {submission.fromCache ? (
                              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                Cached
                              </div>
                            ) : (
                              <div className="bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                                New
                              </div>
                            )}
                            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              {submission.isVideo ? 'Video' : 'Audio'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-700 h-20 rounded flex items-center justify-center mb-4">
                          <div className="flex flex-col items-center text-center">
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4V5h12v10z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M8 7v6l4-3-4-3z" clipRule="evenodd" />
                            </svg>
                            <p className="text-gray-400 text-sm">
                              {submission.quotaExhausted ? 'Video unavailable (quota)' : 
                               submission.youtubeLoadError ? 'Video failed to load' :
                               `No ${preferVideo ? 'video' : 'audio'} available`}
                            </p>
                          </div>
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
                          {(submission.youtubeId || submission.songName) && (
                            <a 
                              href={submission.youtubeId 
                                ? `https://www.youtube.com/watch?v=${submission.youtubeId}`
                                : `https://www.youtube.com/results?search_query=${encodeURIComponent(submission.artist + ' ' + submission.songName)}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="py-2 px-3 bg-red-600 text-white rounded hover:bg-red-700 flex items-center text-sm"
                            >
                              <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                              </svg>
                              {submission.youtubeId ? 'Watch on YouTube' : 'Search YouTube'}
                            </a>
                          )}
                          
                          {/* Vote button */}
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
            
            {/* Show message if there are no submissions to vote on */}
            {votableSubmissions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>No submissions to vote on this round.</p>
              </div>
            )}
          </div>
          
          {!hasVoted && votableSubmissions.length > 0 && (
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
              
              {/* Host controls for ending voting when user hasn't voted */}
              {isHost && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-3">Host Controls:</p>
                  <button
                    onClick={handleEndVotingWithCountdown}
                    disabled={isStartingCountdown || game.countdown?.isActive}
                    className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isStartingCountdown ? 'Starting Countdown...' : 
                     game.countdown?.isActive ? 'Countdown Active' : 
                     'End Voting Phase'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Force all non-voted players to abstain
                  </p>
                  {countdownError && (
                    <div className="mt-2 p-2 bg-red-900/50 text-red-200 rounded text-sm">
                      {countdownError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingScreen;