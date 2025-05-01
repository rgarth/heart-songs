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
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-center">Waiting for Players</h2>
        
        {/* Game code display - enlarged and highlighted */}
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-400 mb-1">Game Code:</p>
          <p className="text-3xl font-bold tracking-wider bg-gray-700 inline-block px-4 py-2 rounded-lg text-yellow-400">
            {game.code}
          </p>
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