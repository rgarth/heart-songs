// client/src/components/VinylRecordWithLabel.js
import React from 'react';

const VinylRecordWithLabel = ({ 
  className = "w-16 h-16", // Smaller default size
  animationClass = "",
  label = "",
  labelColor = "text-white"
}) => {
  // Generate unique IDs for gradients and patterns to avoid conflicts
  const uniqueId = React.useMemo(() => Math.random().toString(36).substr(2, 9), []);
  
  return (
    <div className="relative flex flex-col items-center">
      {/* Large text positioned above the record */}
      <div className={`absolute -top-6 z-20 text-center ${labelColor} font-rock text-3xl font-bold`} style={{
        textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
        width: "150%"
      }}>
        {label}
      </div>
      
      {/* Vinyl record */}
      <svg className={`${className} ${animationClass} relative z-10`} viewBox="0 0 100 100">
        <defs>
          {/* Vinyl disc gradient */}
          <radialGradient id={`vinylGrad-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="0%" style={{stopColor:'#1F2937'}}/>
            <stop offset="30%" style={{stopColor:'#374151'}}/>
            <stop offset="60%" style={{stopColor:'#1F2937'}}/>
            <stop offset="100%" style={{stopColor:'#0F172A'}}/>
          </radialGradient>
          
          {/* Yellow center gradient */}
          <radialGradient id={`yellowGrad-${uniqueId}`} cx="50%" cy="50%">
            <stop offset="0%" style={{stopColor:'#FBBF24'}}/>
            <stop offset="100%" style={{stopColor:'#F59E0B'}}/>
          </radialGradient>
          
          {/* Grooves pattern */}
          <pattern id={`grooves-${uniqueId}`} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3"/>
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3"/>
          </pattern>
        </defs>
        
        {/* Main vinyl disc */}
        <circle cx="50" cy="50" r="48" fill={`url(#vinylGrad-${uniqueId})`} stroke="#374151" strokeWidth="2"/>
        
        {/* Grooves */}
        <circle cx="50" cy="50" r="48" fill={`url(#grooves-${uniqueId})`}/>
        
        {/* Asymmetric reflections/scratches for realism */}
        <path d="M20,30 Q50,25 80,35" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none"/>
        <path d="M25,70 Q60,65 85,75" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" fill="none"/>
        
        {/* Yellow center label */}
        <circle cx="50" cy="50" r="22" fill={`url(#yellowGrad-${uniqueId})`} stroke="#D97706" strokeWidth="2"/>
        
        {/* Center spindle hole */}
        <circle cx="50" cy="50" r="4" fill="#0F172A" stroke="#374151" strokeWidth="1"/>
      </svg>
    </div>
  );
};

export default VinylRecordWithLabel;