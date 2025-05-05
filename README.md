# Heart Songs

A cooperative multiplayer game where players select songs from Spotify to answer random questions, then vote for their favorites.

## Features

- **No Login Required**: Play instantly with fun temporary usernames
- Spotify search for finding the perfect songs
- Real-time game state management
- Multiple rounds with different questions
- Voting system with score tracking
- "Open in Spotify" links for listening to song selections

## Prerequisites

- Node.js and npm
- MongoDB
- Spotify Developer Account (for API access only)

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

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/heart-songs-game

SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
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
6. After all players have submitted their songs, you'll see all submissions
7. Vote for your favorite answer (you cannot vote for your own in games with 3+ players)
8. Scores are tallied based on votes received
9. A new round begins with a different question

## Technologies Used

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Spotify Web API (Client Credentials flow)

### Frontend
- React
- React Router
- Tailwind CSS

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
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
├── .env                  # Environment variables
└── package.json
```

## Why No Spotify Login?

Heart Songs was designed to be easily accessible to everyone. By removing the Spotify login requirement:

- Players can join instantly without creating accounts
- Games can be started quickly with friends
- The experience works consistently across all devices
- Compliance with Spotify API terms is maintained

## Future Plans

- WebSocket integration for real-time updates
- Custom game themes and question packs
- Enhanced mobile experience
- Support for longer gaming sessions

## License

MIT

## Acknowledgements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)