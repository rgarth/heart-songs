// client/src/pages/Terms.js
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-4">Heart Songs Terms of Service</h1>
              <p className="text-gray-400">Last Updated: May 19, 2025</p>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <h2>1. Introduction</h2>
              <p>Welcome to Heart Songs ("Service"). These Terms of Service ("Terms") govern your use of the Heart Songs application and website available at https://heart-songs.vercel.app.</p>
              <p>By accessing or using Heart Songs, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.</p>
              
              <h2>2. Acceptance of YouTube Terms</h2>
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg my-4">
                <p><strong>Important: Heart Songs integrates with YouTube's API services. By using Heart Songs, you also agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">YouTube Terms of Service</a>.</strong></p>
              </div>
              <p>Our use of YouTube's API services is subject to YouTube's Terms of Service (https://www.youtube.com/t/terms). Please review these terms, as they constitute a separate agreement between you and YouTube (Google).</p>
              
              <h2>3. Description of Service</h2>
              <p>Heart Songs is a social music game where players select songs to answer random questions, then vote for their favorites. The Service enables players to search for songs and share them with friends in a game format.</p>
              
              <h2>4. User Registration and Accounts</h2>
              <p>Heart Songs allows you to play with a temporary anonymous account. Your temporary account data is stored for a limited time and automatically expires after 7 days of inactivity.</p>
              
              <h3>4.1 Account Creation</h3>
              <p>Heart Songs allows you to play with a temporary anonymous account. Your temporary account data is stored for a limited time and automatically expires after 7 days of inactivity.</p>
              
              <h3>4.2 User Responsibilities</h3>
              <p>You are responsible for maintaining the confidentiality of your session tokens and for all activities that occur under your temporary account. You agree to:</p>
              <ul>
                <li>Provide accurate information</li>
                <li>Not use offensive or inappropriate usernames</li>
                <li>Not attempt to bypass system limitations</li>
              </ul>
              
              <h2>5. User Content</h2>
              <p>You retain ownership of your User Content. However, by submitting User Content to Heart Songs, you grant Heart Songs a worldwide, non-exclusive, royalty-free license to use, reproduce, and display your User Content solely for the purpose of providing and improving the Service.</p>
              
              <h2>6. Intellectual Property Rights</h2>
              <p>The Service and its original content, features, and functionality are owned by the creators of Heart Songs and are protected by copyright, trademark, and other intellectual property or proprietary rights laws.</p>
              
              <h2>7. YouTube API Services</h2>
              <h3>7.1 YouTube API Integration</h3>
              <p>Heart Songs uses the YouTube API Services to provide video playback functionality. Our use of information received from YouTube APIs will adhere to the <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">YouTube API Services Terms of Service</a>.</p>
              
              <h3>7.2 YouTube Content Restrictions</h3>
              <p>When using YouTube content through our Service:</p>
              <ul>
                <li>You must not download, copy, or redistribute YouTube content</li>
                <li>You must not modify or manipulate the YouTube player or embedding</li>
                <li>You must not use the YouTube content for any purpose not permitted under these Terms or the YouTube Terms of Service</li>
              </ul>
              
              <h3>7.3 YouTube Privacy Policy</h3>
              <p>Our use of data received from the YouTube API Services is subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Privacy Policy</a>.</p>
              
              <h2>8. Privacy</h2>
              <p>We only collect the minimal information necessary to provide the Service. For anonymous users, this includes a temporary identifier, display name, and game activities.</p>
              
              <h2>9. Disclaimers</h2>
              <p>Heart Songs is provided on an "as is" and "as available" basis. We do not guarantee that the Service will be available at all times or free of errors.</p>
              
              <h2>10. Limitation of Liability</h2>
              <p>To the maximum extent permitted by law, in no event shall Heart Songs, its creators, or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
              
              <h2>11. Modifications to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. If we make material changes to these Terms, we will notify you by posting the new Terms on our website or through the Service.</p>
              
              <h2>12. Termination</h2>
              <p>We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including but not limited to a breach of these Terms.</p>
              
              <h2>13. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.</p>
              
              <h2>14. Contact Us</h2>
              <p>If you have any questions about these Terms, please contact us at contact@example.com.</p>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Terms;