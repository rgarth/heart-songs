// client/src/pages/Terms.js - Themed version
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
              {/* Content with improved readability */}
              <div className="prose max-w-none">
                {/* Using a more readable color scheme */}
                <div className="space-y-6 text-silver/90 leading-relaxed">
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">1. Introduction</h2>
                    <p className="mb-3">
                      Welcome to Heart Songs ("Service"). These Terms of Service ("Terms") govern your use of the Heart Songs application and website available at https://heart-songs.vercel.app.
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
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">5. User Content</h2>
                    <p className="mb-3">
                      You retain ownership of your User Content. However, by submitting User Content to Heart Songs, you grant Heart Songs a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your User Content solely for the purpose of providing and improving the Service.
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
                    <h2 className="text-xl font-bold text-turquoise mb-3">8. Privacy</h2>
                    <p className="mb-3">
                      We only collect the minimal information necessary to provide the Service. For anonymous users, this includes a temporary identifier, display name, and game activities.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">9. Disclaimers</h2>
                    <p className="mb-3">
                      Heart Songs is provided on an "as is" and "as available" basis. We do not guarantee that the Service will be available at all times or free of errors.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">10. Limitation of Liability</h2>
                    <p className="mb-3">
                      To the maximum extent permitted by law, in no event shall Heart Songs, its creators, or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">11. Modifications to Terms</h2>
                    <p className="mb-3">
                      We reserve the right to modify these Terms at any time. If we make material changes to these Terms, we will notify you by posting the new Terms on our website or through the Service.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">12. Termination</h2>
                    <p className="mb-3">
                      We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including but not limited to a breach of these Terms.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">13. Governing Law</h2>
                    <p className="mb-3">
                      These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
                    </p>
                  </section>
                  
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-turquoise mb-3">14. Contact Us</h2>
                    <p className="mb-3">
                      If you have any questions about these Terms, please contact us at support@heartsongsgame.app.
                    </p>
                  </section>
                </div>
              </div>
              
            </div>
            
            {/* Footer section - decorative accent */}
            <div className="bg-gradient-to-r from-electric-purple/10 to-neon-pink/10 p-4 text-center border-t border-electric-purple/20">
              <div className="h-1 bg-gradient-to-r from-electric-purple via-neon-pink to-turquoise opacity-30 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Terms;