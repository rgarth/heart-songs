// server/scripts/seedQuestions.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('../models/Question');
const { text } = require('express');

// Load environment variables
dotenv.config();

// Expanded questions data
const questions = [
  // Original questions
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
  },
  
  // NEW QUESTIONS
  // Time period questions
  {
    text: "What's the best one-hit wonder of all time?",
    category: "time"
  },
  {
    text: "What song transports you back to your childhood?",
    category: "time"
  },
  {
    text: "What song will still be popular 100 years from now?",
    category: "time"
  },
  {
    text: "What song defined the 2000s?",
    category: "time"
  },
  {
    text: "What's the best song from the 1970s?",
    category: "time"
  },
  {
    text: "What song feels like it's from another era but is actually recent?",
    category: "time"
  },
  {
    text: "What's a song that was ahead of its time?",
    category: "time"
  },
  {
    text: "What song will people still be listening to in 50 years?",
    category: "time"
  },
  
  // Emotional questions
  {
    text: "What song never fails to make you cry?",
    category: "emotion"
  },
  {
    text: "What song gives you goosebumps every time?",
    category: "emotion"
  },
  {
    text: "What's the happiest song you know?",
    category: "emotion"
  },
  {
    text: "What song helps you through tough times?",
    category: "emotion"
  },
  {
    text: "What song makes you feel invincible?",
    category: "emotion"
  },
  {
    text: "What's the most relaxing song you've ever heard?",
    category: "emotion"
  },
  {
    text: "What song instantly puts you in a good mood?",
    category: "emotion"
  },
  {
    text: "What song makes you feel like you can conquer the world?",
    category: "emotion"
  },
  {
    text: "What song do you listen to when you're feeling lonely?",
    category: "emotion"
  },
  {
    text: "What's the most romantic song ever made?",
    category: "emotion"
  },
  
  // Event/Occasion questions
  {
    text: "What song would you play to kick off a house party?",
    category: "event"
  },
  {
    text: "What's the perfect song for a slow dance?",
    category: "event"
  },
  {
    text: "What song would you want for your first dance at your wedding?",
    category: "event"
  },
  {
    text: "What song would you play at a retirement party?",
    category: "event"
  },
  {
    text: "What's the ideal song for a New Year's Eve countdown?",
    category: "event"
  },
  {
    text: "What song would you choose for a surprise birthday party entrance?",
    category: "event"
  },
  {
    text: "What song would you play to end a perfect night?",
    category: "event"
  },
  
  // Activity questions
  {
    text: "What's the best song to cook to?",
    category: "activity"
  },
  {
    text: "What song would you play while cleaning your home?",
    category: "activity"
  },
  {
    text: "What's your go-to song for a long drive alone?",
    category: "activity"
  },
  {
    text: "What song do you listen to to help you focus on work?",
    category: "activity"
  },
  {
    text: "What's the perfect song for stargazing?",
    category: "activity"
  },
  {
    text: "What song would you play during a camping trip?",
    category: "activity"
  },
  {
    text: "What's the best song to listen to while running?",
    category: "activity"
  },
  {
    text: "What song would you play during a family reunion?",
    category: "activity"
  },
  
  // Personal questions
  {
    text: "What song would be the soundtrack to your life story?",
    category: "personal"
  },
  {
    text: "What song do you secretly love but rarely admit to?",
    category: "personal"
  },
  {
    text: "What song brings back your strongest memory?",
    category: "personal"
  },
  {
    text: "What song represents your greatest achievement?",
    category: "personal"
  },
  {
    text: "What song best describes your past year?",
    category: "personal"
  },
  {
    text: "What song would your family say reminds them of you?",
    category: "personal"
  },
  {
    text: "What song reminds you of your mother?",
    category: "personal"
  },
  {
    text: "What song reminds you of your father?",
    category: "personal"
  },
  
  // Fun/hypothetical questions
  {
    text: "What song would you choose as the national anthem for Mars?",
    category: "fun"
  },
  {
    text: "What song would be playing during the robot uprising?",
    category: "fun"
  },
  {
    text: "What song would you play to scare away ghosts?",
    category: "fun"
  },
  {
    text: "What song would be your superhero theme?",
    category: "fun"
  },
  {
    text: "What song would you use to wake up a sleeping dragon?",
    category: "fun"
  },
  {
    text: "What song would play if your life had end credits?",
    category: "fun"
  },
  
  // Genre questions
  {
    text: "What's the best rock song of all time?",
    category: "genre"
  },
  {
    text: "What hip-hop track changed the game?",
    category: "genre"
  },
  {
    text: "What's the most beautiful classical piece ever composed?",
    category: "genre"
  },
  {
    text: "What's the quintessential country song?",
    category: "genre"
  },
  {
    text: "What EDM track gets the biggest reaction on the dance floor?",
    category: "genre"
  },
  {
    text: "What's the most powerful R&B ballad?",
    category: "genre"
  },
  {
    text: "What jazz standard should everyone know?",
    category: "genre"
  },
  {
    text: "What folk song tells the best story?",
    category: "genre"
  },
  {
    text: "What song has the greated guitar solo?",
    category: "genre"
  },
  {
    text: "What is your favourite Beatles song?",
    category: "genre"
  },
  {
    text: "What is your favourite Taylor Swift song?",
    category: "genre"
  },
  { 
    text: "What is your favourite Elvis song?", 
    category: "genre"
  },
  {
    text: "What is your favourite Michael Jackson song?",
    category: "genre"
  },
  {
    text: "What is your favourite Madonna song?",
    category: "genre"
  },
  {
    text: "What song is most unlike the artists usual other songs?",
    category: "genre"
  },
  {
    text: "What song has the best lyrics?",
    category: "genre"
  },
  {
    text: "What song has the best music video?",
    category: "genre"
  },
  {
    text: "What song has the best album cover?",
    category: "genre"
  },
  {
    text: "What song has the best live performance?",
    category: "genre"
  },
  {
    text: "What song has the best remix?",
    category: "genre"
  },
  {
    text: "What is your favourite cover verision of a song?",
    category: "genre"
  },
  {
    text: "What is your favourite song from a movie?",
    category: "genre"
  },
  { 
    text: "What is your favourite song from a musical?",
    category: "genre"
  },

  // Weather/Season questions
  {
    text: "What song feels like a warm spring day?",
    category: "weather"
  },
  {
    text: "What's the perfect song for a snowy winter night?",
    category: "weather"
  },
  {
    text: "What song captures the beauty of autumn?",
    category: "weather"
  },
  {
    text: "What song would you listen to during a thunderstorm?",
    category: "weather"
  },
  {
    text: "What's the best song to describe the heat of summer?",
    category: "weather"
  },
  {
    text: "What song feels like sitting by a fireplace?",
    category: "weather"
  },
  {
    text: "What song would you play during a hurricane?",
    category: "weather"
  },
  {
    text: "What song reminds you of watching the sunset?",
    category: "weather"
  },
  
  // Place/Location questions
  {
    text: "What song reminds you of your hometown?",
    category: "place"
  },
  {
    text: "What song feels like exploring a new city?",
    category: "place"
  },
  {
    text: "What song would play in the background at a Paris café?",
    category: "place"
  },
  {
    text: "What song feels like being in the mountains?",
    category: "place"
  },
  
  // Situational questions
  {
    text: "What song would you play to psyche yourself up before a job interview?",
    category: "situation"
  },
  {
    text: "What's the perfect song for an awkward silence?",
    category: "situation"
  },
  {
    text: "What song would you play after winning the lottery?",
    category: "situation"
  },
  {
    text: "What song would you want playing during your first kiss?",
    category: "situation"
  },
  {
    text: "What song would you play while making an important life decision?",
    category: "situation"
  },
  {
    text: "What song would be playing while you're getting a tattoo?",
    category: "situation"
  },
  {
    text: "What song would you listen to before asking someone out?",
    category: "situation"
  },
  {
    text: "What song would play during your victory lap?",
    category: "situation"
  },
  
  // Cultural questions
  {
    text: "What song defined a generation?",
    category: "culture"
  },
  {
    text: "What song changed music forever?",
    category: "culture"
  },
  {
    text: "What song should be preserved for future civilizations?",
    category: "culture"
  },
  {
    text: "What song perfectly captures modern society?",
    category: "culture"
  },
  {
    text: "What's the most culturally significant song of the last 50 years?",
    category: "culture"
  },
  {
    text: "What song tells the most important story?",
    category: "culture"
  },
  {
    text: "What song best represents human creativity?",
    category: "culture"
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
    
    console.log(`Questions seeded successfully! Added ${questions.length} questions.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedQuestions();