Heart Songs

A cooperative multiplayer game where players select songs from Spotify to answer random questions, then vote for their favorites.

## Features

- Spotify API integration for searching and playing songs
- Real-time game state management
- Multiple rounds with different questions
- Voting system with score tracking
- Collaborative playlists created for each round

## Prerequisites

- Node.js and npm
- MongoDB
- Spotify Developer Account

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/heart-songs-game.git
cd heart-songs-game
```

### 2. Set Up Spotify Developer Account

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Create a new application
4. Note your Client ID and Client Secret
5. Add `http://127.0.0.1:3000/callback` as a Redirect URI in your app settings

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/heart-songs-game

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://127.0.0.1:3000/callback
FRONTEND_URI=http://127.0.0.1:3000
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

1. Log in with your Spotify account
2. Create a new game or join an existing one with a game code
3. Wait for all players to mark themselves as ready
4. When the game starts, a random question will be displayed
5. Search for and select a song that best answers the question
6. After all players have submitted their songs, you'll see all submissions
7. Vote for your favorite answer (you cannot vote for your own)
8. Scores are tallied based on votes received
9. A new round begins with a different question

## Technologies Used

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Spotify Web API

### Frontend
- React
- React Router
- Tailwind CSS
- Spotify Web Playback SDK

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
│   ├── controllers/      # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   └── services/         # Business logic
├── .env                  # Environment variables
└── package.json
```

## License

MIT

## Acknowledgements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Spotify Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk/)