# Heart Songs

A cooperative multiplayer game where players select songs to answer random questions, then vote for their favorites. Songs are discovered through Last.fm and played via YouTube.

## Features

- **No Login Required**: Play instantly with fun temporary usernames
- Global song search powered by Last.fm and YouTube
- Real-time game state management
- Multiple rounds with different questions
- Voting system with score tracking
- YouTube video playback for all songs
- Speed bonus for the first player to submit each round

## Prerequisites

- Node.js and npm
- MongoDB
- Last.fm API key
- YouTube Data API key

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/heart-songs-game.git
cd heart-songs-game
```

### 2. Set Up API Keys

1. **Last.fm API Key**
   - Go to [Last.fm API](https://www.last.fm/api/account/create)
   - Create an API account
   - Copy your API key

2. **YouTube Data API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the YouTube Data API v3
   - Create API credentials
   - Copy your API key

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/heart-songs-game

# API Keys
LASTFM_API_KEY=your_lastfm_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

### 4. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 5. Seed the Database with Questions

```bash
npm run seed
```

### 6. Start the Development Servers

In one terminal:
```bash
# Start the backend server
npm run dev
```

In another terminal:
```bash
# Start the frontend development server
cd client
npm start
```

The application should now be running at [http://127.0.0.1:3000](http://127.0.0.1:3000)

## How to Play

1. Enter the game by creating a fun username or using the auto-generated one
2. Create a new game or join an existing one with a game code
3. Wait for all players to mark themselves as ready
4. When the game starts, a random question will be displayed
5. Search for and select a song that best answers the question
6. After all players have submitted their songs, you'll see all submissions with YouTube players
7. Vote for your favorite answer (you cannot vote for your own in games with 3+ players)
8. Scores are tallied based on votes received
9. A new round begins with a different question

## Technologies Used

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Last.fm API (for song metadata)
- YouTube Data API (for video playback)

### Frontend
- React
- React Router
- Tailwind CSS
- YouTube embeds

## Project Structure

```
heart-songs-game/
├── client/               # React frontend
│   ├── public/
│   └── src/
│       ├── components/   # UI components
│       ├── context/      # React contexts
│       ├── pages/        # Page components
│       ├── services/     # API service functions
│       └── utils/        # Helper functions
├── server/               # Node.js backend
│   ├── config/           # Configuration files
│   ├── middleware/       # Middleware functions
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   ├── services/         # Music API integrations
│   └── utils/            # Helper functions
├── .env                  # Environment variables
└── package.json
```

## Why No Login Required?

Heart Songs was designed to be easily accessible to everyone. By removing login requirements:

- Players can join instantly without creating accounts
- Games can be started quickly with friends
- The experience works consistently across all devices
- No dependency on third-party authentication

## Music Integration

Heart Songs uses a combination of two APIs for a seamless music experience:

1. **Last.fm API** provides song metadata, artist information, and album artwork
2. **YouTube Data API** provides matching videos for song playback

This integration offers several advantages:
- No authentication required
- Full song playback (not just previews)
- Visual experience with music videos
- Broader song catalog availability

## Future Plans

- WebSocket integration for real-time updates
- Custom game themes and question packs
- Enhanced mobile experience
- Support for longer gaming sessions
- Playlist export functionality

## License

MIT

## Acknowledgements

- [Last.fm API](https://www.last.fm/api)
- [YouTube Data API](https://developers.google.com/youtube/v3)