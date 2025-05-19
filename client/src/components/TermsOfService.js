// client/src/components/TermsOfService.js - Updated with Privacy Policy reference
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TermsOfService = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  
  const handleAccept = () => {
    setAccepted(true);
    localStorage.setItem('termsAccepted', 'true');
    if (onAccept) {
      onAccept();
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-b from-stage-dark to-vinyl-black rounded-lg shadow-2xl border border-electric-purple/30 overflow-hidden">
      <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30">
        <h2 className="text-3xl font-rock text-center neon-text bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent">
          Terms of Service
        </h2>
        <p className="text-silver text-center mt-2">Please review and accept before continuing</p>
      </div>
      
      <div className="p-6">
        <div className="bg-gradient-to-r from-deep-space/50 to-stage-dark/50 rounded-lg p-6 border border-electric-purple/30 mb-6 max-h-96 overflow-y-auto custom-scrollbar">
          <div className="terms-content text-white">
            <h1>Heart Songs Terms of Service</h1>
            <p>Last Updated: May 19, 2025</p>
            
            <h2>1. Introduction</h2>
            <p>Welcome to Heart Songs ("Service"). These Terms of Service ("Terms") govern your use of the Heart Songs application and website available at https://heart-songs.vercel.app.</p>
            <p>By accessing or using Heart Songs, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.</p>
            
            <h2>2. Acceptance of YouTube Terms</h2>
            <p><strong>Important: Heart Songs integrates with YouTube's API services. By using Heart Songs, you also agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-electric-purple underline">YouTube Terms of Service</a>.</strong></p>
            <p>Our use of YouTube's API services is subject to YouTube's Terms of Service (https://www.youtube.com/t/terms). Please review these terms, as they constitute a separate agreement between you and YouTube (Google).</p>
            
            <h2>3. Description of Service</h2>
            <p>Heart Songs is a social music game where players select songs to answer random questions, then vote for their favorites. The Service enables players to search for songs and share them with friends in a game format.</p>
            
            <h2>4. User Registration and Accounts</h2>
            <p>Heart Songs allows you to play with a temporary anonymous account. Your temporary account data is stored for a limited time and automatically expires after 7 days of inactivity.</p>
            
            <h2>5. Privacy Policy</h2>
            <p>Your privacy is important to us. Our <Link to="/privacy" className="text-electric-purple underline">Privacy Policy</Link> explains how we collect, use, and protect your personal information. By using Heart Songs, you also agree to our Privacy Policy.</p>
            <p>Our Privacy Policy includes information about our use of YouTube API Services and how we handle information received through these services, in compliance with the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-electric-purple underline">Google Privacy Policy</a>.</p>
            
            <h2>14. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@heartsongsgame.app.</p>
          </div>
        </div>
        
        {/* YouTube specific callout */}
        <div className="bg-gradient-to-r from-gold-record/20 to-yellow-400/20 rounded-lg p-4 border border-gold-record/40 mb-6">
          <p className="text-white text-center">
            <strong>Important:</strong> By using Heart Songs, you agree to be bound by the{' '}
            <a 
              href="https://www.youtube.com/t/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold-record underline hover:text-yellow-400"
            >
              YouTube Terms of Service
            </a>{' '}
            and acknowledge our{' '}
            <Link 
              to="/privacy" 
              className="text-gold-record underline hover:text-yellow-400"
            >
              Privacy Policy
            </Link>{' '}
            which explains how we use information from Google APIs.
          </p>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleAccept}
            className="btn-gold py-2 px-4 bg-gradient-to-r from-gold-record to-yellow-400 text-vinyl-black hover:shadow-xl hover:shadow-gold-record/40"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;