// client/tailwind.config.js - Updated with Rockstar Color Palette
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original grays (kept for compatibility)
        'gray-750': '#2d3748',
        'gray-850': '#1a202c',
        
        // NEW Rockstar Color Palette
        // Primary Colors - Stage Lighting
        'electric-purple': '#9333EA',
        'neon-pink': '#EC4899',
        'vinyl-black': '#1F2937',
        'gold-record': '#FBBF24',
        
        // Secondary Colors - Concert Atmosphere
        'stage-red': '#DC2626',
        'lime-green': '#65A30D',
        'turquoise': '#06B6D4',
        'silver': '#94A3B8',
        
        // Backgrounds - Deep Space Vibes
        'deep-space': '#0F172A',
        'stage-dark': '#1E293B',
        'midnight-purple': '#1E1B4B',
        
        // Special Effects
        'spotlight': 'rgba(147, 51, 234, 0.1)',
        'neon-glow': 'rgba(236, 72, 153, 0.2)',
      },
      
      // Custom gradients for stage lighting effects
      backgroundImage: {
        'stage-lights': 'linear-gradient(45deg, #9333EA, #EC4899, #06B6D4)',
        'vinyl-record': 'radial-gradient(circle, #1F2937 0%, #0F172A 100%)',
        'gold-shimmer': 'linear-gradient(45deg, #FBBF24, #F59E0B, #FBBF24)',
        'electric-glow': 'linear-gradient(135deg, #9333EA 0%, #EC4899 100%)',
      },
      
      // Custom shadows for neon effects
      boxShadow: {
        'neon-purple': '0 0 20px rgba(147, 51, 234, 0.5)',
        'neon-pink': '0 0 20px rgba(236, 72, 153, 0.5)',
        'neon-gold': '0 0 15px rgba(251, 191, 36, 0.4)',
        'stage-light': '0 0 30px rgba(147, 51, 234, 0.3)',
      },
      
      // Animations
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-neon': 'pulse 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'vinyl-spin': 'spin 33s linear infinite',
      },
      
      // Custom keyframes
      keyframes: {
        glow: {
          'from': { boxShadow: '0 0 20px rgba(147, 51, 234, 0.5)' },
          'to': { boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)' },
        },
      },
      
      // Typography for concert poster feel
      fontFamily: {
        'rock': ['Bebas Neue', 'Impact', 'sans-serif'],
        'concert': ['Oswald', 'sans-serif'],
      },
      
      // Border radius for vinyl records
      borderRadius: {
        'vinyl': '50%',
        'gold-record': '50%',
      },
      
      // Custom spacing for stage layouts
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
  
  // Safe list for dynamic classes
  safelist: [
    'animate-vinyl-spin',
    'shadow-neon-purple',
    'shadow-neon-pink',
    'shadow-neon-gold',
    'bg-stage-lights',
    'bg-electric-glow',
  ]
}