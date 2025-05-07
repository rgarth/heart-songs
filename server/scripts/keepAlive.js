// server/scripts/keepAlive.js
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MongoDB URI from environment variables
const BASE_URL = process.env.API_URI;

// Generate a random username in the required format
function generateUsername() {
  const firstWords = ['ping', 'keep', 'alive', 'render', 'test'];
  const secondWords = ['monitor', 'service', 'check', 'uptime', 'job'];
  const first = firstWords[Math.floor(Math.random() * firstWords.length)];
  const second = secondWords[Math.floor(Math.random() * secondWords.length)];
  const number = Math.floor(1000 + Math.random() * 9000);
  
  return `${first}_${second}_${number}`;
}

// Single ping function that runs once and exits
async function pingServer() {
  try {
    console.log(`Pinging ${BASE_URL}/api/auth/register-anonymous at ${new Date().toISOString()}`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/register-anonymous`, {
      username: generateUsername()
    });
    
    console.log(`Response: ${response.status} - Successfully created user ${response.data.user.displayName}`);
    console.log('Ping complete. Exiting...');
  } catch (error) {
    console.error(`Error pinging app: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    }
    process.exit(1); // Exit with error code
  }
}

// Run once and exit
pingServer().then(() => {
  process.exit(0); // Exit with success code
});