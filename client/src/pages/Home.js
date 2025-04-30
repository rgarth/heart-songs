// client/src/pages/Home.js
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createGame, joinGame } from '../services/gameService';

const Home = () => {
  const { user, accessToken, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCreateGame = async () => {
    try {
      setLoading(true);
      setError('');
      
      const game = await createGame(user.id, accessToken);
      
      // Navigate to game page
      navigate(`/game/${game.gameId}`);
    } catch (error) {
      console.error('Error creating game:', error);
      setError('Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const game = await joinGame(gameCode.trim().toUpperCase(), user.id, accessToken);
      
      // Navigate to game page
      navigate(`/game/${game.gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      setError('Failed to join game. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold">Heart Songs</h1>
          <div className="flex items-center">
            {user?.profileImage && (
              <img 
                src={user.profileImage} 
                alt={user.displayName} 
                className="w-10 h-10 rounded-full mr-3" 
              />
            )}
            <div className="mr-4">
              <p className="font-medium">{user?.displayName}</p>
              <p className="text-sm text-gray-400">Score: {user?.score || 0}</p>
            </div>
            <button 
              onClick={logout}
              className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </header>
        
        <div className="max-w-xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-bold mb-6">Create or Join a Game</h2>
            
            {error && (
              <div className="bg-red-500 text-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-6">
              <div>
                <button 
                  onClick={handleCreateGame}
                  disabled={loading}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create New Game'}
                </button>
              </div>
              
              <div className="relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gray-700"></div>
                <div className="relative flex justify-center">
                  <span className="bg-gray-800 px-4 text-sm text-gray-400 -mt-3">OR</span>
                </div>
              </div>
              
              <form onSubmit={handleJoinGame}>
                <div className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value)}
                    placeholder="Enter Game Code"
                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">How to Play</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Create a new game or join with a code</li>
              <li>Wait for all players to be ready</li>
              <li>A random question will be shown (e.g., "Best song to play at a wedding?")</li>
              <li>Everyone picks a song from Spotify that answers the question</li>
              <li>After everyone has chosen, all songs are revealed</li>
              <li>Players vote for their favorite answer (except their own)</li>
              <li>Points are awarded based on votes</li>
              <li>Repeat with new questions!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;