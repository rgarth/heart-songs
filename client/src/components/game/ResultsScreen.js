// client/src/components/game/ResultsScreen.js
import React from 'react';

const ResultsScreen = ({ game, currentUser, onNextRound }) => {
  // Sort submissions by votes (most votes first)
  const sortedSubmissions = [...game.submissions].sort(
    (a, b) => b.votes.length - a.votes.length
  );
  
  // Check if current user is the host
  const isHost = game.host._id === currentUser.id;
  
  // Get player by ID
  const getPlayerById = (playerId) => {
    return game.players.find(p => p.user._id === playerId);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Round Results</h2>
        
        <div className="text-center mb-6">
          <p className="text-lg text-yellow-400 font-medium">{game.currentQuestion.text}</p>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Songs & Votes</h3>
          <div className="space-y-4">
            {sortedSubmissions.map((submission, index) => {
              const player = submission.player;
              const isCurrentUserSubmission = player._id === currentUser.id;
              
              return (
                <div 
                  key={submission._id}
                  className={`bg-gray-750 rounded-lg overflow-hidden ${
                    index === 0 ? 'border-2 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center p-4">
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
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                            Winner!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{submission.artist}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-sm">
                          Selected by: <span className="font-medium">{player.displayName}</span>
                          {isCurrentUserSubmission && (
                            <span className="ml-1 text-blue-400">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {submission.votes.length}
                      </div>
                      <div className="text-xs text-gray-400">
                        {submission.votes.length === 1 ? 'vote' : 'votes'}
                      </div>
                    </div>
                  </div>
                  
                  {submission.votes.length > 0 && (
                    <div className="bg-gray-700 px-4 py-2">
                      <p className="text-sm text-gray-300">
                        Votes from: {submission.votes.map(voter => (
                          <span key={voter._id} className="font-medium">
                            {voter.displayName}
                            {voter._id === currentUser.id && <span className="text-blue-400"> (You)</span>}
                            {', '}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Scoreboard</h3>
          <div className="space-y-2">
            {game.players
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((player, index) => (
                <div 
                  key={player.user._id}
                  className={`flex items-center justify-between bg-gray-700 p-3 rounded-lg ${
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
        
        {isHost && (
          <div className="text-center">
            <button
              onClick={onNextRound}
              className="py-3 px-8 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Start Next Round
            </button>
            <p className="text-sm text-gray-400 mt-2">
              As the host, you can start the next round when everyone is ready.
            </p>
          </div>
        )}
        
        {!isHost && (
          <div className="text-center text-gray-300">
            Waiting for the host to start the next round...
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;