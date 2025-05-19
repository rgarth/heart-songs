// client/src/pages/Privacy.js
import React from 'react';
import { Link } from 'react-router-dom';
import ResponsiveLayout from '../components/ResponsiveLayout';

const Privacy = () => {
  return (
    <ResponsiveLayout
      title="Heart Songs Privacy Policy"
      lastUpdated="May 19, 2025"
      linkType="privacy"
    >
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">1. Introduction</h2>
        <p className="mb-3">
          This Privacy Policy explains how Heart Songs ("we", "our", or "us") collects, uses, and shares information about you when you use our web application and related services (collectively, the "Service").
        </p>
        <p className="mb-3">
          By using Heart Songs, you agree to the collection and use of information in accordance with this policy. This Privacy Policy is part of our <Link to="/terms" className="text-electric-purple hover:text-neon-pink underline">Terms of Service</Link>.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">2. YouTube API Services</h2>
        <div className="p-4 bg-gradient-to-r from-gold-record/10 to-yellow-400/10 rounded-lg my-4 border border-gold-record/30">
          <p className="font-semibold text-gold-record">
            Important: Heart Songs uses YouTube API Services to provide video playback functionality. Our use of information received from Google APIs will adhere to the <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-gold-record hover:text-yellow-300 underline">YouTube API Services Terms of Service</a>.
          </p>
        </div>
        <p className="mb-3">
          As part of using YouTube API Services, this application is subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-electric-purple hover:text-neon-pink underline">Google Privacy Policy</a>. We encourage you to review Google's Privacy Policy to understand how Google treats your information.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">3. Information We Collect</h2>
        
        <h3 className="text-lg font-semibold text-electric-purple mb-2">3.1 Information You Provide</h3>
        <p className="mb-3">
          We collect information you provide directly to us when you use our Service:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li><strong>Account Information:</strong> When you create a temporary account, we collect a display name (either generated or customized by you).</li>
          <li><strong>Game Information:</strong> We collect information about the games you create or join, including game codes, submissions, votes, and scores.</li>
          <li><strong>Song Selections:</strong> When you search for and select songs within the game, we collect information about your song choices, including song titles, artist names, and related metadata.</li>
        </ul>
        
        <h3 className="text-lg font-semibold text-electric-purple mb-2">3.2 Information Collected Through YouTube API Services</h3>
        <p className="mb-3">
          When you use features that interact with YouTube through our Service, we may receive the following information:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li>YouTube video IDs, titles, and metadata related to the songs you search for and select</li>
          <li>Thumbnail images associated with videos</li>
          <li>Information about video availability</li>
        </ul>
        <p className="mb-3">
          We do not receive or collect your YouTube account information, watch history, or other personal information from YouTube.
        </p>
        
        <h3 className="text-lg font-semibold text-electric-purple mb-2">3.3 Information Collected Automatically</h3>
        <p className="mb-3">
          When you use our Service, we automatically collect certain information:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li><strong>Device Information:</strong> We collect information about the device you use to access our Service, including device type, operating system, browser type, and IP address.</li>
          <li><strong>Usage Information:</strong> We collect information about how you interact with our Service, including the pages you visit, the time and duration of your visit, and the actions you take within the Service.</li>
          <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar technologies to collect information about your browsing activities and to maintain your session information. See Section 7 for more details.</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">4. How We Use Your Information</h2>
        <p className="mb-3">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li>To provide, maintain, and improve our Service</li>
          <li>To create and manage your temporary account</li>
          <li>To process and track your game participation, submissions, and scores</li>
          <li>To search for and display YouTube videos related to your song selections</li>
          <li>To communicate with you about the Service, including game notifications and updates</li>
          <li>To prevent fraud, protect the security of our Service, and address technical issues</li>
          <li>To comply with legal obligations</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">5. Information Sharing and Disclosure</h2>
        <p className="mb-3">
          We may share your information in the following circumstances:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li><strong>With Other Users:</strong> Your display name, song selections, and votes are visible to other users in the games you participate in.</li>
          <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf, such as hosting, data analysis, and customer service.</li>
          <li><strong>Third-Party APIs:</strong> When you use features that interact with third-party services (such as YouTube), information is shared with those services as necessary to provide the functionality you requested.</li>
          <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests from public authorities.</li>
        </ul>
        
        <p className="mb-3">
          We do not sell your personal information to third parties.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">6. Data Retention</h2>
        <p className="mb-3">
          Heart Songs is designed to provide temporary gaming sessions with minimal data retention:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li>Temporary user accounts expire and are automatically deleted after 7 days of inactivity.</li>
          <li>Game data (including submissions and votes) is retained for 7 days after the game ends, after which it is automatically deleted.</li>
          <li>YouTube search results and video information are cached for up to 90 days to improve performance and reduce API usage.</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">7. Cookies and Similar Technologies</h2>
        <p className="mb-3">
          Heart Songs uses cookies and similar technologies to collect and store information when you visit our Service. Cookies are small text files that are stored on your device.
        </p>
        
        <h3 className="text-lg font-semibold text-electric-purple mb-2">7.1 Types of Cookies We Use</h3>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li><strong>Session Cookies:</strong> These are temporary cookies that expire when you close your browser. They are used to maintain your session and authentication state while using the Service.</li>
          <li><strong>Persistent Cookies:</strong> These remain on your device between browsing sessions. They are used to remember your preferences and settings.</li>
          <li><strong>LocalStorage:</strong> We use browser local storage to maintain game state, session tokens, and temporary data needed for the application to function.</li>
        </ul>
        
        <h3 className="text-lg font-semibold text-electric-purple mb-2">7.2 How We Use Cookies</h3>
        <p className="mb-3">
          We use cookies and similar technologies for the following purposes:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li>To authenticate you and maintain your session</li>
          <li>To store your temporary user account information</li>
          <li>To remember your preferences and settings</li>
          <li>To maintain game state and history</li>
          <li>To improve service performance and efficiency</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">8. Your Rights and Choices</h2>
        <p className="mb-3">
          You have certain rights and choices regarding your information:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1 text-silver/90">
          <li><strong>Account Information:</strong> Since we use temporary accounts, your account and related data will be automatically deleted after 7 days of inactivity.</li>
          <li><strong>Cookies:</strong> You can manage cookie preferences through your browser settings.</li>
          <li><strong>Do Not Track:</strong> While we do our best to respect user preferences, our Service does not currently respond to Do Not Track signals.</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">9. Children's Privacy</h2>
        <p className="mb-3">
          Our Service is not directed to children under the age of 13, and we do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete that information.
        </p>
      </section>
      
      <section className="mb-8 bg-gradient-to-r from-gold-record/10 to-yellow-400/10 rounded-lg p-6 border border-gold-record/30">
        <h2 className="text-xl font-bold text-gold-record mb-3">Google API Services User Data Policy</h2>
        <p className="mb-3">
          Heart Songs uses YouTube API Services and adheres to the <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer" className="text-gold-record hover:text-yellow-300 underline">Google API Services User Data Policy</a>.
        </p>
        <p className="mb-3">
          For more information about how Google treats your data, please review the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-record hover:text-yellow-300 underline">Google Privacy Policy</a>.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-turquoise mb-3">10. Contact Us</h2>
        <p className="mb-3">
          If you have any questions about this Privacy Policy, please contact us at:
        </p>
        <p className="mb-3 text-electric-purple">
          support@heartsongsgame.app
        </p>
      </section>
    </ResponsiveLayout>
  );
};

export default Privacy;