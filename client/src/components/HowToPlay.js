// client/src/components/HowToPlay.js
import React from 'react';
import VinylRecord from './VinylRecord';

const HowToPlay = ({ className = "" }) => {
  return (
    <div className={`bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-lg border border-gold-record/30 p-8 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-3xl font-rock text-gold-record mb-3 flex items-center justify-center">
          HOW TO PLAY
        </h2>
      </div>
      
      <div className="grid md:grid-cols-4 gap-6">
        {/* Step 1 - Find Friends */}
        <div className="bg-gradient-to-b from-electric-purple/10 to-electric-purple/5 rounded-lg p-6 text-center border border-electric-purple/20">
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
          <h3 className="text-lg font-semibold text-electric-purple mb-2">Find Some Friends</h3>
          <p className="text-sm text-silver">Heartsongs is a multiplayer game. Invite some friends along to start the party, or play against an AI</p>
        </div>

        {/* Step 2 */}
        <div className="bg-gradient-to-b from-neon-pink/10 to-neon-pink/5 rounded-lg p-6 text-center border border-neon-pink/20">
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
          <h3 className="text-lg font-semibold text-neon-pink mb-2">Pick Your Songs</h3>
          <p className="text-sm text-silver">Answer quirky questions with the perfect track</p>
        </div>
        
        {/* Step 3 */}
        <div className="bg-gradient-to-b from-turquoise/10 to-lime-green/10 rounded-lg p-6 text-center border border-turquoise/20">
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
          <h3 className="text-lg font-semibold text-turquoise mb-2">Vote & Vibe</h3>
          <p className="text-sm text-silver">Listen to everyone's picks and vote for favorites</p>
        </div>
        
        {/* Step 4 */}
        <div className="bg-gradient-to-b from-gold-record/10 to-yellow-400/10 rounded-lg p-6 text-center border border-gold-record/20">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <VinylRecord 
              className="w-16 h-16"
              animationClass="animate-vinyl-spin group-hover:animate-spin-slow"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-black text-white drop-shadow-[0_0_2px_black] leading-none -translate-y-[1px] relative">
                4
              </span>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gold-record mb-2">Win the Crowd</h3>
          <p className="text-sm text-silver">Score points and become the ultimate music maestro</p>
        </div>
      </div>
    </div>
  );
};

export default HowToPlay;