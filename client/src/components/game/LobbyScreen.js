// client/src/components/game/LobbyScreen.js
import React from 'react';

const LobbyScreen = ({ game, currentUser, onToggleReady }) => {
  // Find current user in players list
  const currentPlayer = game.players.find(p => p.user._id === currentUser.id);
  const isHost = game.host._id === currentUser.id;
  
  // Check if all players are ready
  const allPlayersReady = game.players.every(p => p.isReady);
  
  // Check if there are at least 2 players
  const hasEnoughPlayers = game.players.length >= 2;

  // Handle sharing game code
  const handleShareGameCode = async () => {
    // Create direct join URL
    const joinUrl = `${window.location.origin}/join/${game.gameCode}`;
    const shareText = `Join my Heart Songs game: ${joinUrl}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Heart Songs Game Invite',
          text: 'Join my Heart Songs game!',
          url: joinUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to clipboard copy if sharing fails
        copyToClipboard(joinUrl);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(joinUrl);
    }
  };

  // Fallback: copy to clipboard
  const copyToClipboard = (url) => {
    try {
      navigator.clipboard.writeText(url);
      // You could add a toast notification here if you had a notification system
      alert('Game invite link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Waiting for Players</h2>
        
        {/* Game code display - enlarged and highlighted with share button */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Game Code:</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold tracking-wider bg-gray-700 inline-block px-4 py-2 rounded-lg text-yellow-400">
              {game.gameCode}
            </p>
            <button 
              onClick={handleShareGameCode}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
              aria-label="Share game code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Share this code with friends to let them join</p>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Players ({game.players.length})</h3>
          <div className="space-y-3">
            {game.players.map(player => (
              <div 
                key={player.user._id} 
                className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
              >
                <div className="flex items-center">
                  {player.user.profileImage && (
                    <img 
                      src={player.user.profileImage} 
                      alt={player.user.displayName} 
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {player.user.displayName}
                      {player.user._id === game.host._id && (
                        <span className="ml-2 text-xs bg-yellow-600 text-white px-2 py-1 rounded">Host</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-400">Score: {player.score}</p>
                  </div>
                </div>
                <div>
                  {player.isReady ? (
                    <span className="text-green-500 font-medium">Ready</span>
                  ) : (
                    <span className="text-red-500 font-medium">Not Ready</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-center">
          {currentPlayer && (
            <button
              onClick={onToggleReady}
              disabled={!hasEnoughPlayers && !currentPlayer.isReady}
              className={`py-3 px-6 rounded-lg font-medium ${
                currentPlayer.isReady 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : hasEnoughPlayers
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
            >
              {currentPlayer.isReady ? 'Cancel Ready' : 'Ready Up'}
            </button>
          )}
        </div>
        
        <div className="mt-6 text-center text-gray-400">
          {!hasEnoughPlayers ? (
            <div className="text-yellow-500 font-medium mb-2">
              At least 2 players are required to start the game. Waiting for more players to join...
            </div>
          ) : allPlayersReady ? (
            "All players are ready! The game will start in a moment..." 
          ) : (
            "Waiting for all players to be ready..."
          )}
          
          {game.players.length < 3 && hasEnoughPlayers && (
            <div className="mt-2 text-blue-400">
              Note: In games with fewer than 3 players, you can vote for your own submission.
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium mb-2">How to Play</h3>
          <ol className="list-decimal pl-5 space-y-1 text-gray-300">
            <li>Once everyone is ready, you'll see a random question</li>
            <li>Select a song from Spotify that answers the question</li>
            <li>After everyone has chosen, all songs are revealed</li>
            <li>Vote for your favorite answer {game.players.length < 3 ? "(you can vote for your own)" : "(except your own)"}</li>
            <li>Points are awarded based on votes</li>
            <li>Play multiple rounds to determine the winner!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LobbyScreen;