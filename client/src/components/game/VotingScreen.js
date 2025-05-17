// client/src/components/game/VotingScreen.js - Fixed Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Create stable dependency strings to prevent unnecessary re-renders
  const submissionKeyString = useMemo(() => {
    return game.submissions.map(s => 
      `${s._id}-${s.songId}-${s.songName}-${s.artist}-${s.hasPassed}-${s.player?.displayName}`
    ).join(',');
  }, [game.submissions]);

  const voteDataString = useMemo(() => {
    return game.submissions.map(s => 
      `${s._id}-${s.votes?.length || 0}-${s.votes?.map(v => v._id).join(',')}`
    ).join('|');
  }, [game.submissions]);
  
  // OPTIMIZATION: Memoize submission keys to prevent iframe reloads
  // Only include submission data that affects iframe rendering, not vote counts
  const submissionKeys = useMemo(() => {
    return game.submissions.map(s => ({
      id: s._id,
      songId: s.songId,
      songName: s.songName,
      artist: s.artist,
      albumCover: s.albumCover,
      hasPassed: s.hasPassed,
      playerName: s.player?.displayName || 'Unknown',
      player: s.player // Keep full player object for ownership checks
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionKeyString]);
  
  // OPTIMIZATION: Separate memo for vote counts to avoid affecting iframe rendering
  const voteData = useMemo(() => {
    return game.submissions.map(s => ({
      id: s._id,
      voteCount: s.votes?.length || 0,
      votes: s.votes || []
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteDataString]);
  
  // Check if user has already voted
  useEffect(() => {
    const userVoted = game.submissions.some(s => 
      s.votes.some(v => v._id === currentUser.id)
    );
    
    if (userVoted) {
      setHasVoted(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteDataString, currentUser.id]);
  
  // OPTIMIZATION: Wrap loadSubmissionsWithPreference in useCallback with stable dependencies
  const loadSubmissionsWithPreference = useCallback(async () => {
    if (!submissionKeys || submissionKeys.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Start with the submissions as-is, combining with game data for votes
      const submissionsWithVotes = submissionKeys.map(subKey => {
        const gameSubmission = game.submissions.find(s => s._id === subKey.id);
        return {
          ...subKey,
          votes: gameSubmission?.votes || []
        };
      });
      
      setLocalSubmissions(submissionsWithVotes);
      
      // Set loading states only for non-passed submissions
      const loadingStates = {};
      
      submissionsWithVotes.forEach(submission => {
        if (!submission.hasPassed) {
          loadingStates[submission.id] = true;
        }
      });
      
      setYoutubeLoadingStates(loadingStates);
      
      // Fetch YouTube data for each non-passed submission
      await Promise.all(submissionsWithVotes.map(async (submission, index) => {
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
          submissionsWithVotes[index] = {
            ...submission,
            youtubeId: trackWithYoutube.youtubeId,
            youtubeTitle: trackWithYoutube.youtubeTitle,
            quotaExhausted: trackWithYoutube.quotaExhausted,
            fromCache: trackWithYoutube.fromCache,
            isVideo: trackWithYoutube.isVideo,
            preferredType: trackWithYoutube.preferredType
          };          
        } catch (error) {
          console.error(`Error loading YouTube for ${submission.songName}:`, error);
          
          // Mark as failed to load
          submissionsWithVotes[index] = {
            ...submission,
            youtubeLoadError: true
          };
        } finally {
          // Remove loading state
          setYoutubeLoadingStates(prev => {
            const newState = { ...prev };
            delete newState[submission.id];
            return newState;
          });
        }
      }));
      
      // Update state with all YouTube data
      setLocalSubmissions(submissionsWithVotes);
            
    } catch (error) {
      console.error('Error loading submissions:', error);
      setError('Failed to load video data. You can still vote!');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionKeys, preferVideo]);

  // OPTIMIZATION: Use memoized submission keys instead of game.submissions
  useEffect(() => {
    loadSubmissionsWithPreference();
  }, [loadSubmissionsWithPreference]);

  // Separate effect to update vote counts without triggering iframe reload
  useEffect(() => {
    if (localSubmissions.length > 0) {
      setLocalSubmissions(prevSubmissions => 
        prevSubmissions.map(submission => {
          const voteInfo = voteData.find(v => v.id === submission.id);
          return {
            ...submission,
            votes: voteInfo?.votes || []
          };
        })
      );
    }
  }, [voteData, localSubmissions.length]);

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
  
  // Handle end voting with server countdown
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
  
  // Generate YouTube watch URL
  const getYouTubeWatchUrl = (youtubeId) => {
    if (!youtubeId) return null;
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  };
  
  // Check if there are no votable submissions (everyone passed)
  const allPassed = votableSubmissions.length === 0;
  
  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
          <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
            <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
              VOTE FOR THE BEST SONG
            </h2>
            <p className="text-silver text-center mt-2">Loading the concert lineup...</p>
          </div>
          
          <div className="text-center py-12">
            <div className="text-lg text-yellow-400 font-medium mb-8">{game.currentQuestion.text}</div>
            
            <div className="flex justify-center items-center mb-4">
              <div className="vinyl-record w-16 h-16 animate-spin mr-4"></div>
              <div className="equalizer">
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>
            </div>
            <p className="text-silver">Loading songs in {preferVideo ? 'video' : 'audio'} format...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // If everyone passed
  if (allPassed) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
          <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
            <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
              VOTE FOR THE BEST ACT
            </h2>
          </div>
          
          <div className="text-center py-12">
            <div className="text-lg text-yellow-400 font-medium mb-8">{game.currentQuestion.text}</div>
            
            <div className="mb-6">
              <div className="inline-block bg-stage-dark/50 rounded-full p-8">
                <svg className="w-20 h-20 text-silver mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-rock text-silver mb-4">EMPTY STAGE</h3>
            <p className="text-silver mb-6">
              All band members passed on this challenge. Moving to the next round...
            </p>
            <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 inline-block border border-electric-purple/20">
              <p className="text-sm text-silver">
                {passedCount} performer{passedCount !== 1 ? 's' : ''} passed on this question
              </p>
            </div>
          </div>
          
          {isHost && (
            <div className="p-6 border-t border-electric-purple/20 text-center">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-electric-purple/20">
                <p className="text-sm text-silver mb-3 flex items-center justify-center">
                  Bandleader Controls
                </p>
                <button
                  onClick={handleEndVotingWithCountdown}
                  disabled={isStartingCountdown || game.countdown?.isActive}
                  className="btn-electric disabled:opacity-50"
                >
                  {isStartingCountdown ? (
                    <>
                      <div className="vinyl-record w-5 h-5 animate-spin mr-2 inline-block"></div>
                      Starting Countdown...
                    </>
                  ) : game.countdown?.isActive ? (
                    'Countdown Active'
                  ) : (
                    <>
                      END VOTING PHASE
                    </>
                  )}
                </button>
                <p className="text-xs text-silver mt-2">
                  Force the show to continue
                </p>
                {countdownError && (
                  <div className="mt-2 p-2 bg-red-900/50 text-red-200 rounded text-sm">
                    {countdownError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
        <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
          <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
            VOTE FOR THE BEST SONG
          </h2>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-vinyl-black to-stage-dark rounded-lg p-6 border-l-4 border-neon-pink">
              <div className="flex items-center justify-center mb-2">
                <p className="text-xl font-bold text-neon-pink">The Question</p>
              </div>
              <p className="text-2xl font-rock text-yellow-400">{game.currentQuestion.text}</p>
            </div>
          </div>
          
          {votableSubmissions.length > 0 && (
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-4 border border-electric-purple/20">
                <VideoPreferenceToggle
                  preferVideo={preferVideo}
                  onToggle={() => setPreferVideo(!preferVideo)}
                  disabled={loading}
                  showLabel={true}
                />
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-4 border border-electric-purple/30">
              <div className="flex justify-between items-center">
                <p className="text-silver font-medium">
                  Vote for the best choice {isSmallGame ? "" : "(not your own)"}
                </p>
                <div className="flex items-center">
                  <span className="text-gold-record font-bold">{votedCount}/{totalPlayers}</span>
                  <span className="text-silver ml-2">votes cast</span>
                  <div className="ml-3 equalizer">
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                    <div className="equalizer-bar"></div>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-vinyl-black rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise transition-all duration-500"
                  style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="mb-6 space-y-3">
            {passedCount > 0 && (
              <div className="bg-gradient-to-r from-silver/10 to-stage-dark/50 rounded-lg p-3 border border-silver/20">
                <div className="flex items-center text-silver">
                  <span className="mr-2">Note:</span>
                  <span><strong>Note:</strong> {passedCount} performer{passedCount !== 1 ? 's' : ''} passed on this challenge</span>
                </div>
              </div>
            )}
            
            {hasQuotaIssue && (
              <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-lg p-3 border border-yellow-600/40">
                <div className="flex items-center text-yellow-200">
                  <span className="mr-2">Note:</span>
                  <span><strong>Note:</strong> Video embeds temporarily unavailable due to daily quota limits. You can still vote!</span>
                </div>
              </div>
            )}
            
            {hasActivePlayers && game.activePlayers.length < game.players.length && (
              <div className="bg-gradient-to-r from-purple-600/20 to-neon-pink/20 rounded-lg p-3 border border-purple-600/40">
                <div className="flex items-center text-purple-200">
                  <span className="mr-2">This Act:</span>
                  <span><strong>This Act:</strong> {game.activePlayers.length} of {game.players.length} players performing tonight</span>
                </div>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-6 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-4">
              <div className="flex items-center text-stage-red">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
          
          {hasVoted && (
            <div className="mb-8 text-center">
              <div className="bg-gradient-to-r from-lime-green/20 to-green-600/20 rounded-lg p-6 border border-lime-green/40 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 w-32 h-32 bg-lime-green/10 rounded-full -translate-x-1/2 -translate-y-16 blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="mb-4">
                    <div className="vinyl-record w-16 h-16 mx-auto animate-spin-slow">
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">✓</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-rock text-lime-green mb-2">VOTE RECORDED!</h3>
                  <p className="text-silver text-sm">
                    Your vote has been cast! Enjoy the rest of the performances while we wait.
                  </p>
                  
                  {isHost && (
                    <div className="mt-6 pt-4 border-t border-lime-green/20">
                      <p className="text-sm text-silver mb-3 flex items-center justify-center">
                        Bandleader Controls
                      </p>
                      <button
                        onClick={handleEndVotingWithCountdown}
                        disabled={isStartingCountdown || game.countdown?.isActive}
                        className="btn-electric disabled:opacity-50"
                      >
                        {isStartingCountdown ? (
                          <>
                            <div className="vinyl-record w-5 h-5 animate-spin mr-2 inline-block"></div>
                            Starting Countdown...
                          </>
                        ) : game.countdown?.isActive ? (
                          'Countdown Active'
                        ) : (
                          <>
                            END VOTING PHASE
                          </>
                        )}
                      </button>
                      <p className="text-xs text-silver mt-2">
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
            </div>
          )}
          
          <div className="space-y-6 mb-8">
            <h3 className="text-2xl font-rock text-center text-gold-record flex items-center justify-center">
              THE SONGS
            </h3>
            
            {localSubmissions.map(submission => {
              const isOwnSubmission = submission.player?._id === currentUser.id;
              const isLoadingYoutube = youtubeLoadingStates[submission.id];
              const isPassed = submission.hasPassed;
              
              if (isPassed) {
                return null;
              }
              
              return (
                <div 
                  key={`${submission.id}-${submission.songId}`}
                  className={`bg-gradient-to-r from-stage-dark to-vinyl-black rounded-lg overflow-hidden border transition-all ${
                    !hasVoted && (!isOwnSubmission || isSmallGame) ? 'cursor-pointer hover:border-neon-pink/50 hover:shadow-neon-purple/30 hover:shadow-lg' : 'border-electric-purple/30'
                  } ${
                    selectedSubmission === submission.id ? 'border-neon-pink shadow-neon-pink/50 shadow-lg' : ''
                  } ${
                    isOwnSubmission ? 'relative border-t-4 border-t-gold-record' : ''
                  }`}
                  onClick={() => {
                    if (!hasVoted && (isSmallGame || !isOwnSubmission)) {
                      setSelectedSubmission(submission.id);
                    }
                  }}
                >
                  {isOwnSubmission && (
                    <div className="absolute top-0 left-4 -mt-2 bg-gold-record text-vinyl-black text-xs px-3 py-1 rounded font-bold">
                      YOUR PERFORMANCE
                    </div>
                  )}
                  
                  <div className="p-6">
                    {isLoadingYoutube ? (
                      <div className="h-72 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg flex items-center justify-center mb-6 border border-electric-purple/20">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center mb-4">
                            <div className="vinyl-record w-12 h-12 animate-spin mr-4"></div>
                            <div className="equalizer">
                              <div className="equalizer-bar"></div>
                              <div className="equalizer-bar"></div>
                              <div className="equalizer-bar"></div>
                              <div className="equalizer-bar"></div>
                              <div className="equalizer-bar"></div>
                            </div>
                          </div>
                          <p className="text-silver text-lg">Loading {preferVideo ? 'video' : 'audio'}...</p>
                        </div>
                      </div>
                    ) : submission.youtubeId ? (
                      <div className="relative rounded-lg overflow-hidden border border-electric-purple/30">
                        <iframe 
                          key={`${submission.id}-${submission.youtubeId}-${preferVideo}`}
                          src={getYouTubeEmbedUrl(submission.youtubeId)}
                          width="100%" 
                          height="300"
                          frameBorder="0" 
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                          title={`${submission.songName} by ${submission.artist}`}
                          className="rounded"
                        ></iframe>
                      </div>
                    ) : (
                      <div className="h-72 bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg flex items-center justify-center mb-6 border border-silver/20">
                        <div className="flex flex-col items-center text-center">
                          <div className="vinyl-record w-20 h-20 mb-4 opacity-50">
                            <div className="absolute inset-0 flex items-center justify-center text-2xl">Not Available</div>
                          </div>
                          <p className="text-silver text-lg">
                            {submission.quotaExhausted ? 'Video unavailable (quota)' : 
                             submission.youtubeLoadError ? 'Video failed to load' :
                             `No ${preferVideo ? 'video' : 'audio'} available`}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {submission.albumCover && (
                          <div className="float-left mr-4 mb-2">
                            <img 
                              src={submission.albumCover} 
                              alt={submission.songName} 
                              className="w-16 h-16 rounded-lg border-2 border-silver" 
                            />
                          </div>
                        )}
                        
                        <div>
                          <p className="font-bold text-white text-xl font-rock">{submission.songName}</p>
                          <p className="text-silver text-lg font-medium">{submission.artist}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-turquoise text-sm">Chosen by: </span>
                            <span className="text-white font-medium ml-1">{submission.playerName}</span>
                            {isOwnSubmission && (
                              <span className="ml-2 text-gold-record font-bold">(YOU)</span>
                            )}
                          </div>
                          
                          <div className="flex items-center mt-2">
                            <span className="text-neon-pink text-sm">Votes: </span>
                            <span className="text-white font-bold text-lg ml-1">{submission.votes?.length || 0}</span>
                            {submission.votes?.length > 0 && (
                              <span className="text-silver text-sm ml-2">
                                {submission.votes?.length === 1 ? 'vote' : 'votes'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3 ml-4">
                        {(submission.youtubeId || submission.songName) && (
                          <a 
                            href={submission.youtubeId 
                              ? getYouTubeWatchUrl(submission.youtubeId)
                              : `https://www.youtube.com/results?search_query=${encodeURIComponent(submission.artist + ' ' + submission.songName)}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="btn-stage text-sm min-w-[120px] px-4 py-2 flex justify-center group"
                          >
                            <span className="relative z-10 flex items-center">
                              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62-4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                              </svg>
                              {submission.youtubeId ? 'WATCH FULL' : 'SEARCH YT'}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          </a>
                        )}
                        
                        {!hasVoted && (isSmallGame || !isOwnSubmission) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubmission(submission.id);
                            }}
                            className={`btn-stage text-sm min-w-[120px] px-4 py-2 flex justify-center group ${
                              selectedSubmission === submission.id ? 'bg-gradient-to-r from-neon-pink to-electric-purple border-neon-pink text-white' : ''
                            }`}
                          >
                            <span className="relative z-10 flex items-center">
                              {selectedSubmission === submission.id ? (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  SELECTED
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                  CHOOSE THIS
                                </>
                              )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {submission.votes && submission.votes.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-electric-purple/20">
                        <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-3 border border-electric-purple/20">
                          <p className="text-sm text-silver mb-2 flex items-center">
                            <span className="font-medium">Fan Votes:</span>
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {submission.votes.map((voter, index) => (
                              <div key={voter._id} className="flex items-center">
                                <span className="bg-gradient-to-r from-vinyl-black to-stage-dark px-3 py-1 rounded-full text-sm border border-electric-purple/30">
                                  <span className="text-white font-medium">{voter.displayName}</span>
                                  {voter._id === currentUser.id && (
                                    <span className="text-neon-pink ml-1">(YOU)</span>
                                  )}
                                  {voter._id === submission.player._id && (
                                    <span className="text-gold-record ml-1">(SELF)</span>
                                  )}
                                </span>
                                {index < submission.votes.length - 1 && (
                                  <span className="text-electric-purple mx-2">•</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {votableSubmissions.length === 0 && (
              <div className="text-center py-12">
                <div className="vinyl-record w-20 h-20 mx-auto mb-4 opacity-50">
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">No songs</div>
                </div>
                <p className="text-silver text-lg">No performances available for voting this round.</p>
              </div>
            )}
          </div>
          
          {!hasVoted && votableSubmissions.length > 0 && (
            <div className="text-center">
              <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 rounded-lg p-6 border border-electric-purple/30">
                <button
                  onClick={handleVote}
                  disabled={!selectedSubmission || isVoting}
                  className="btn-gold disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden mb-4"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isVoting ? (
                      <>
                        <div className="vinyl-record w-6 h-6 animate-spin mr-3"></div>
                        CASTING VOTE...
                      </>
                    ) : (
                      <>
                        CAST YOUR VOTE
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                <p className="text-sm text-silver mb-4">
                  Select the best song choice{isSmallGame ? "" : " from another player"}, then cast your vote
                </p>
                
                {isHost && (
                  <div className="pt-4 border-t border-electric-purple/20">
                    <p className="text-sm text-silver mb-3 flex items-center justify-center">
                      Bandleader Controls
                    </p>
                    <button
                      onClick={handleEndVotingWithCountdown}
                      disabled={isStartingCountdown || game.countdown?.isActive}
                      className="btn-electric disabled:opacity-50"
                    >
                      {isStartingCountdown ? (
                        <>
                          <div className="vinyl-record w-5 h-5 animate-spin mr-2 inline-block"></div>
                          Starting Countdown...
                        </>
                      ) : game.countdown?.isActive ? (
                        'Countdown Active'
                      ) : (
                        <>
                          END VOTING PHASE
                        </>
                      )}
                    </button>
                    <p className="text-xs text-silver mt-2">
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
          )}
        </div>
        
      </div>
    </div>
  );
};

export default VotingScreen;