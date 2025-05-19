// client/src/pages/Terms.js - Updated with Privacy Policy references
import React from 'react';
import { Link } from 'react-router-dom';
import VinylRecord from '../components/VinylRecord';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Card with themed styling */}
          <div className="bg-gradient-to-b from-stage-dark to-midnight-purple/90 rounded-lg shadow-xl overflow-hidden">
            {/* Header section with decorative elements */}
            <div className="bg-gradient-to-r from-electric-purple/20 to-neon-pink/20 p-6 border-b border-electric-purple/30 relative">
              {/* Position vinyl on left, vertically aligned */}
              <div className="absolute left-6 top-1/2 transform -translate-y-1/2">
                <VinylRecord 
                  className="w-24 h-24" 
                  animationClass="animate-vinyl-spin"
                />
              </div>
              
              <div className="text-center">
                <h1 className="text-3xl font-rock bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise bg-clip-text text-transparent mb-2">
                  Heart Songs Terms of Service
                </h1>
                <p className="text-silver">Last Updated: May 19, 2025</p>
              </div>
            </div>
            
            <div className="p-8">
              {/* Privacy Policy Callout - Added at the top for visibility */}
              <div className="mb-8 bg-gradient-to-r from-gold-record/10 to-yellow-400/10 rounded-lg p-6 border border-gold-record/30">
                <h2 className="text-xl font-bold text-gold-record mb-3">Important Privacy Information</h2>
                <p className="mb-3">
                  Please review our <Link to="/privacy" className="text-gold-record font-semibold underline hover:text-yellow-300">Privacy Policy</Link> which explains how we collect, use, and share your information, including our use of YouTube API Services.
                </p>
                <p className="mb-0">
                  By using Heart Songs, you agree to our Privacy Policy and the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-record font-semibold underline hover:text-yellow-300">Google Privacy Policy</a>.
                </p>
              </div>
              
              {/* Content with improved readability */}
              <div className="prose max-w-none">
                {/* Using a more readable color scheme */}
                <div className="space-y-6 text-silver/90 leading-relaxed">
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">1. Introduction</h2>
                    <p className="mb-3">
                      Welcome to Heart Songs ("Service"). These Terms of Service ("Terms") govern your use of the Heart Songs application and website available at https://heartsongs.app.
                    </p>
                    <p className="mb-3">
                      By accessing or using Heart Songs, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">2. Acceptance of YouTube Terms</h2>
                    <div className="p-4 bg-gradient-to-r from-gold-record/10 to-yellow-400/10 rounded-lg my-4 border border-gold-record/30">
                      <p className="font-semibold text-gold-record">
                        Important: Heart Songs integrates with YouTube's API services. By using Heart Songs, you also agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-gold-record hover:text-yellow-300 underline">YouTube Terms of Service</a>.
                      </p>
                    </div>
                    <p className="mb-3">
                      Our use of YouTube's API services is subject to YouTube's Terms of Service (https://www.youtube.com/t/terms). Please review these terms, as they constitute a separate agreement between you and YouTube (Google).
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">3. Description of Service</h2>
                    <p className="mb-3">
                      Heart Songs is a social music game where players select songs to answer random questions, then vote for their favorites. The Service enables players to search for songs and share them with friends in a game format.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">4. User Registration and Accounts</h2>
                    <p className="mb-3">
                      Heart Songs allows you to play with a temporary anonymous account. Your temporary account data is stored for a limited time and automatically expires after 7 days of inactivity.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-electric-purple mb-2">4.1 Account Creation</h3>
                    <p className="mb-3">
                      Heart Songs allows you to play with a temporary anonymous account. Your temporary account data is stored for a limited time and automatically expires after 7 days of inactivity.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-electric-purple mb-2">4.2 User Responsibilities</h3>
                    <p className="mb-3">
                      You are responsible for maintaining the confidentiality of your session tokens and for all activities that occur under your temporary account. You agree to:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
                      <li>Provide accurate information</li>
                      <li>Not use offensive or inappropriate usernames</li>
                      <li>Not attempt to bypass system limitations</li>
                    </ul>
                  </section>
                  
                  {/* NEW SECTION: PRIVACY POLICY */}
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">5. Privacy Policy</h2>
                    <p className="mb-3">
                      Your privacy is important to us. Our <Link to="/privacy" className="text-electric-purple hover:text-neon-pink underline">Privacy Policy</Link> explains how we collect, use, and protect your personal information when you use our Service.
                    </p>
                    <p className="mb-3">
                      The Privacy Policy includes important information about:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
                      <li>What information we collect, including information related to your use of YouTube API Services</li>
                      <li>How we use cookies and similar technologies</li>
                      <li>How we use and share your information</li>
                      <li>Your rights regarding your information</li>
                      <li>Our data retention practices</li>
                    </ul>
                    <p className="mb-3">
                      By using our Service, you agree to our Privacy Policy. Our use of information received from Google APIs will adhere to the <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-electric-purple hover:text-neon-pink underline">Google API Services User Data Policy</a>.
                    </p>
                    <p className="mb-3">
                      For more information about how Google treats your data, please review the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-electric-purple hover:text-neon-pink underline">Google Privacy Policy</a>.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">6. Intellectual Property Rights</h2>
                    <p className="mb-3">
                      The Service and its original content, features, and functionality are owned by the creators of Heart Songs and are protected by copyright, trademark, and other intellectual property or proprietary rights laws.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">7. YouTube API Services</h2>
                    <h3 className="text-lg font-semibold text-electric-purple mb-2">7.1 YouTube API Integration</h3>
                    <p className="mb-3">
                      Heart Songs uses the YouTube API Services to provide video playback functionality. Our use of information received from YouTube APIs will adhere to the <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-electric-purple hover:text-neon-pink underline">YouTube API Services Terms of Service</a>.
                    </p>
                    
                    <h3 className="text-lg font-semibold text-electric-purple mb-2">7.2 YouTube Content Restrictions</h3>
                    <p className="mb-3">
                      When using YouTube content through our Service:
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
                      <li>You must not download, copy, or redistribute YouTube content</li>
                      <li>You must not modify or manipulate the YouTube player or embedding</li>
                      <li>You must not use the YouTube content for any purpose not permitted under these Terms or the YouTube Terms of Service</li>
                    </ul>
                    
                    <h3 className="text-lg font-semibold text-electric-purple mb-2">7.3 YouTube Privacy Policy</h3>
                    <p className="mb-3">
                      Our use of data received from the YouTube API Services is subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-electric-purple hover:text-neon-pink underline">Google Privacy Policy</a>.
                    </p>
                  </section>
                  
                  {/* Additional sections would continue here... */}
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">8. Disclaimers</h2>
                    <p className="mb-3">
                      Heart Songs is provided on an "as is" and "as available" basis. We do not guarantee that the Service will be available at all times or free of errors.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">9. Limitation of Liability</h2>
                    <p className="mb-3">
                      To the maximum extent permitted by law, in no event shall Heart Songs, its creators, or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">10. Modifications to Terms</h2>
                    <p className="mb-3">
                      We reserve the right to modify these Terms at any time. If we make material changes to these Terms, we will notify you by posting the new Terms on our website or through the Service.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">11. Termination</h2>
                    <p className="mb-3">
                      We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including but not limited to a breach of these Terms.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">12. Governing Law</h2>
                    <p className="mb-3">
                      These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">13. Contact Us</h2>
                    <p className="mb-3">
                      If you have any questions about these Terms or our <Link to="/privacy" className="text-electric-purple hover:text-neon-pink underline">Privacy Policy</Link>, please contact us at:
                    </p>
                    <p className="mb-3 text-electric-purple">
                      support@heartsongsgame.app
                    </p>
                  </section>
                </div>
              </div>
              
            </div>
            
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Terms;