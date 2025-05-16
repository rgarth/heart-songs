// client/src/pages/Home.js - Rockstar Design Edition
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createGame, joinGame } from '../services/gameService';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VinylRecord from '../components/VinylRecord';

const Home = () => {
  const { user, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleCreateGame = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user || !user.id) {
        console.error('Missing user data:', { hasUser: !!user, hasUserId: user?.id });
        setError('Authentication error. Please login again.');
        setLoading(false);
        return;
      }
      
      // Get the most up-to-date token (either from context or localStorage)
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token available');
        setError('Authentication error. Please login again.');
        setLoading(false);
        return;
      }
      
      const game = await createGame(user.id, token);
      
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
      
      if (!user || !user.id) {
        console.error('Missing user data:', { hasUser: !!user, hasUserId: user?.id });
        setError('Authentication error. Please login again.');
        setLoading(false);
        return;
      }
      
      // Get the most up-to-date token (either from context or localStorage)
      const token = accessToken || localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No authentication token available');
        setError('Authentication error. Please login again.');
        setLoading(false);
        return;
      }
      
      const game = await joinGame(gameCode.trim().toUpperCase(), user.id, token);
      
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
    <div className="min-h-screen stage-bg text-white flex flex-col">
      <Header />
      
      {/* Main stage area */}
      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero section - Concert stage intro */}
          <div className="text-center mb-12">
            <div className="relative inline-block mb-8">
              {/* Spotlights */}
              <div className="absolute -top-16 -left-8 w-32 h-32 bg-electric-purple/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-16 -right-8 w-32 h-32 bg-neon-pink/10 rounded-full blur-3xl"></div>
              
              <h1 className="text-6xl md:text-7xl font-rock neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-4">
                ROCK THE STAGE
              </h1>
              <p className="text-xl text-silver font-medium">
                Your music taste defines you
              </p>
            </div>
            
            {/* Equalizer animation */}
            <div className="flex justify-center mb-8">
              <div className="equalizer">
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
                <div className="equalizer-bar"></div>
              </div>
            </div>
          </div>
          
          {/* Main game controls - Amplifier style */}
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 p-8 mb-8">
            
            {/* Error display */}
            {error && (
              <div className="mb-6 bg-gradient-to-r from-stage-red/20 to-red-600/20 border border-stage-red/40 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center text-stage-red">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Create game - Left channel */}
              <div className="bg-gradient-to-br from-electric-purple/10 to-neon-pink/10 rounded-lg p-6 border border-electric-purple/30">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-electric-purple to-neon-pink rounded-full mb-4">
                    <span className="text-2xl">🎤</span>
                  </div>
                  <h2 className="text-2xl font-rock text-electric-purple mb-2">
                    START THE SHOW
                  </h2>
                  <p className="text-silver text-sm">
                    Create a new game and invite friends to join your concert
                  </p>
                </div>
                
                <button 
                  onClick={handleCreateGame}
                  disabled={loading}
                  className="w-full btn-electric group relative overflow-hidden disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {loading ? (
                      <>
                        <div className="vinyl-record w-5 h-5 animate-spin mr-2"></div>
                        SETTING UP STAGE...
                      </>
                    ) : (
                      <>
                        CREATE GAME
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
              
              {/* Join game - Right channel */}
              <div className="bg-gradient-to-br from-turquoise/10 to-lime-green/10 rounded-lg p-6 border border-turquoise/30">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-turquoise to-lime-green rounded-full mb-4">
                    <span className="text-2xl">🎸</span>
                  </div>
                  <h2 className="text-2xl font-rock text-turquoise mb-2">
                    JOIN THE BAND
                  </h2>
                  <p className="text-silver text-sm">
                    Enter a game code to join someone else's concert
                  </p>
                </div>
                
                <form onSubmit={handleJoinGame} className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value)}
                      placeholder="Enter Game Code"
                      className="w-full p-4 bg-vinyl-black text-white rounded-lg border border-turquoise/30 focus:border-lime-green focus:outline-none focus:shadow-neon-purple/50 focus:shadow-lg transition-all font-mono uppercase text-center text-xl tracking-widest placeholder-silver/50"
                      maxLength={6}
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center text-turquoise/50">
                      🎟️
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={loading || !gameCode.trim()}
                    className="w-full btn-electric bg-gradient-to-r from-turquoise to-lime-green hover:from-lime-green hover:to-turquoise relative overflow-hidden group disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <>
                          <div className="vinyl-record w-5 h-5 animate-spin mr-2"></div>
                          JOINING...
                        </>
                      ) : (
                        <>
                          JOIN GAME
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          {/* How to play - Simplified with rock styling */}
          <div className="bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-lg border border-gold-record/30 p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-rock text-gold-record mb-3 flex items-center justify-center">
                HOW TO PLAY
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="bg-gradient-to-b from-electric-purple/10 to-neon-pink/10 rounded-lg p-6 text-center border border-electric-purple/20">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <VinylRecord 
                    className="w-16 h-16"
                    animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                      1
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-electric-purple mb-2">Pick Your Songs</h3>
                <p className="text-sm text-silver">Answer quirky questions with the perfect track</p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-gradient-to-b from-turquoise/10 to-lime-green/10 rounded-lg p-6 text-center border border-turquoise/20">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <VinylRecord 
                    className="w-16 h-16"
                    animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                      2
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-turquoise mb-2">Vote & Vibe</h3>
                <p className="text-sm text-silver">Listen to everyone's picks and vote for favorites</p>
              </div>
              
              {/* Step 3 */}
              <div className="bg-gradient-to-b from-gold-record/10 to-yellow-400/10 rounded-lg p-6 text-center border border-gold-record/20">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <VinylRecord 
                    className="w-16 h-16"
                    animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                      3
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gold-record mb-2">Win the Crowd</h3>
                <p className="text-sm text-silver">Score points and become the ultimate music maestro</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;