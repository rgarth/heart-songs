// server/scripts/seedQuestions.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');

// Load environment variables
dotenv.config();

// Questions data
const questions = [
  {
    text: "What is the best song from the 90s?",
    category: "time"
  },
  {
    text: "What song would you play at a wedding?",
    category: "event"
  },
  {
    text: "What song would aliens enjoy the most?",
    category: "fun"
  },
  {
    text: "What song represents your personality?",
    category: "personal"
  },
  {
    text: "What's the best song to listen to on a road trip?",
    category: "activity"
  },
  {
    text: "What song would you play at a beach party?",
    category: "event"
  },
  {
    text: "What song would you use as your theme song?",
    category: "personal"
  },
  {
    text: "What song makes you feel nostalgic?",
    category: "emotion"
  },
  {
    text: "What song would you play to introduce someone to your favorite genre?",
    category: "genre"
  },
  {
    text: "What's the best song for a workout?",
    category: "activity"
  },
  {
    text: "What song would you play to cheer someone up?",
    category: "emotion"
  },
  {
    text: "What song would be playing during the climax of a movie about your life?",
    category: "personal"
  },
  {
    text: "What song would you play on a first date?",
    category: "event"
  },
  {
    text: "What's the best song released in the last year?",
    category: "time"
  },
  {
    text: "What song would you play to put a baby to sleep?",
    category: "activity"
  },
  {
    text: "What song reminds you of summer?",
    category: "season"
  },
  {
    text: "What song would play during the apocalypse?",
    category: "fun"
  },
  {
    text: "What song would you choose for your grand entrance?",
    category: "personal"
  },
  {
    text: "What song best represents the 2010s?",
    category: "time"
  },
  {
    text: "What song would you play to introduce Earth to aliens?",
    category: "fun"
  },
  {
    text: "What song would you play at your graduation party?",
    category: "event"
  },
  {
    text: "What song makes you want to dance no matter what?",
    category: "emotion"
  },
  {
    text: "What song would be perfect for a rainy day?",
    category: "weather"
  },
  {
    text: "What's the best song for a karaoke night?",
    category: "activity"
  },
  {
    text: "What song would you play during a zombie apocalypse?",
    category: "fun"
  },
  {
    text: "What song best represents your country?",
    category: "place"
  },
  {
    text: "What song would you play to calm yourself down?",
    category: "emotion"
  },
  {
    text: "What song would you want played at your funeral?",
    category: "event"
  },
  {
    text: "What song would you play to motivate yourself for a big challenge?",
    category: "activity"
  },
  {
    text: "What song best represents the spirit of the 80s?",
    category: "time"
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

// Seed questions
const seedQuestions = async () => {
  try {
    // Delete existing questions
    await Question.deleteMany({});
    
    // Insert new questions
    await Question.insertMany(questions);
    
    console.log('Questions seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedQuestions();