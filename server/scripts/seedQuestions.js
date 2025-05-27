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
    text: "What's the best song for a workout?",
    category: "activity"
  },
  {
    text: "What song would you play to cheer someone up?",
    category: "emotion"
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
    text: "What is the saddest song?",
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
    text: "What song instantly puts you in a good mood?",
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
    text: "What song would you play to end a perfect night?",
    category: "event"
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
  {
    text: "What song would be the soundtrack to your life story?",
    category: "personal"
  },
  {
    text: "What song do you secretly love but rarely admit to?",
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
  {
    text: "What song would you choose as the national anthem for Mars?",
    category: "fun"
  },
  {
    text: "What song would be playing during the robot uprising?",
    category: "fun"
  },
  {
    text: "What song would be your superhero theme?",
    category: "fun"
  },
  {
    text: "What song would play if your life had end credits?",
    category: "fun"
  },
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
    text: "What's the most powerful R&B ballad?",
    category: "genre"
  },
  {
    text: "What jazz standard should everyone know?",
    category: "genre"
  },
  {
    text: "What song tells the best story?",
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
  {
    text: "What song feels like a warm spring day?",
    category: "weather"
  },
  {
    text: "What's the perfect song for a snowy winter night?",
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
  {
    text: "What song defines your generation?",
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
    text: "What song best represents human creativity?",
    category: "culture"
  },
  {
    text: "What song would play during your most embarrassing moment?",
    category: "embarrassing"
  },
  {
    text: "What song would you never admit you know all the words to?",
    category: "embarrassing"
  },
  {
    text: "What song best describes your dating life?",
    category: "embarrassing"
  },
  {
    text: "What song would play when you're trying to look cool but failing?",
    category: "embarrassing"
  },
  {
    text: "What song would you sing in the shower if no one could hear?",
    category: "embarrassing"
  },
  {
    text: "What song describes your cooking skills?",
    category: "embarrassing"
  },
  // Everyday Life/Relatable
  {
    text: "What song plays when you're procrastinating?",
    category: "daily"
  },
  {
    text: "What song describes Monday mornings?",
    category: "daily"
  },
  {
    text: "What song represents waiting in line at the grocery store?",
    category: "daily"
  },
  {
    text: "What song would play during a really awkward elevator ride?",
    category: "daily"
  },
  {
    text: "What song describes your relationship with your alarm clock?",
    category: "daily"
  },
  {
    text: "What song would play while you're stuck in traffic?",
    category: "daily"
  },
  // Creative/Imaginative Scenarios
  {
    text: "What song would make the perfect ringtone for your pet?",
    category: "creative"
  },
  {
    text: "What song would dinosaurs have listened to?",
    category: "creative"
  },
  // Food/Drink Related
  {
    text: "What song would you play while making breakfast?",
    category: "food"
  },
  {
    text: "What song describes your relationship with coffee?",
    category: "food"
  },
  {
    text: "What song goes with ice cream?",
    category: "food"
  },
  // Technology/Modern Life
  {
    text: "What song represents your phone dying at 1%?",
    category: "tech"
  },
  {
    text: "What song would you play while deleting old photos?",
    category: "tech"
  },
  // Friendship/Social
  {
    text: "What song would you dedicate to your weirdest friend?",
    category: "friendship"
  },
  {
    text: "What song would you play to apologize to a friend?",
    category: "friendship"
  },
  {
    text: "What song describes your friend group?",
    category: "friendship"
  },
  {
    text: "What song describes your family?",
    category: "family"
  },
  {
    text: "What song would you sing at a sleepover?",
    category: "friendship"
  },
  // Dreams/Sleep
  {
    text: "What song would wake you up gently?",
    category: "dreams"
  },
  {
    text: "What song would cure insomnia?",
    category: "dreams"
  },
  // Weird/Random
  {
    text: "What song represents stepping on a LEGO?",
    category: "weird"
  },

  // Childhood/Nostalgia
  {
    text: "What song represents your inner child?",
    category: "childhood"
  },
  {
    text: "What song would you play on a playground",
    category: "childhood"
  },
  {
    text: "What song reminds you of being in trouble as a kid?",
    category: "childhood"
  },
  // Travel/Adventure
  {
    text: "What song would you play while lost?",
    category: "travel"
  },
  // more
  {
    text: "What is the most annoying song?",
    category: "music"
  },
  {
    text: "Name a truly terrible song",
    category: "music"
  },
  // Best/Greatest Songs
  {
    text: "What's the catchiest song ever made?",
    category: "best"
  },
  {
    text: "What's the best opening line in any song?",
    category: "best"
  },
  {
    text: "What's the most addictive song you can't stop playing?",
    category: "best"
  },
  {
    text: "What's the best song to sing along to in the car?",
    category: "best"
  },
  {
    text: "What's the most beautiful song ever written?",
    category: "best"
  },
  {
    text: "What's the best duet of all time?",
    category: "best"
  },
  // Love & Romance
  {
    text: "What's your favorite love song?",
    category: "love"
  },
  {
    text: "What song makes you believe in love?",
    category: "love"
  },
  {
    text: "What's the cheesiest love song that you secretly love?",
    category: "love"
  },

  // Breakups & Heartbreak
  {
    text: "What's the best breakup song?",
    category: "breakup"
  },
  {
    text: "What's the saddest breakup song?",
    category: "breakup"
  },
  {
    text: "What song helps you get over someone?",
    category: "breakup"
  },
  {
    text: "What's the angriest breakup song?",
    category: "breakup"
  },
  {
    text: "What song would you dedicate to your ex?",
    category: "breakup"
  },
  {
    text: "What's the best revenge song?",
    category: "breakup"
  },
  // Emotions & Moods
  {
    text: "What song makes you feel fearless?",
    category: "emotion"
  },
  {
    text: "What song captures pure joy?",
    category: "emotion"
  },
  {
    text: "What's the most haunting song you know?",
    category: "emotion"
  },

  // Personal Connection
  {
    text: "What song defines your teenage years?",
    category: "personal"
  },
  {
    text: "What song always reminds you of someone special?",
    category: "personal"
  },
  {
    text: "What song did you overplay until you ruined it?",
    category: "personal"
  },
  {
    text: "What song makes you think of your best friend?",
    category: "personal"
  },
  {
    text: "What song reminds you of the best night of your life?",
    category: "personal"
  },
  // Musical Elements
  {
    text: "What song has the best bass line?",
    category: "musical"
  },
  {
    text: "What song has the most incredible vocals?",
    category: "musical"
  },
  {
    text: "What song has the best guitar riff?",
    category: "musical"
  },
  {
    text: "What song has the most memorable hook?",
    category: "musical"
  },
  {
    text: "What song has lyrics that hit differently?",
    category: "musical"
  },
  {
    text: "What song has the best beat drop?",
    category: "musical"
  },
  // Guilty Pleasures & Secrets
  {
    text: "What's your biggest musical guilty pleasure?",
    category: "guilty"
  },
  {
    text: "What song do you love that everyone else hates?",
    category: "guilty"
  },
  {
    text: "What song are you embarrassed to admit you know every word to?",
    category: "guilty"
  },
  {
    text: "What's your favorite song that's completely outside your usual taste?",
    category: "guilty"
  },
  // Life Moments
  {
    text: "What song takes you back to your first concert?",
    category: "memory"
  },
  {
    text: "What song makes you think of late night conversations?",
    category: "memory"
  },
  {
    text: "What song reminds you of your first job?",
    category: "memory"
  },

  // Party & Social
  {
    text: "What's the ultimate party anthem?",
    category: "party"
  },
  {
    text: "What song gets everyone singing along?",
    category: "party"
  },
  {
    text: "What song clears the dance floor?",
    category: "party"
  },
  {
    text: "What's your go-to karaoke showstopper?",
    category: "party"
  },

  // Specific Scenarios (but music-relevant)
  {
    text: "What song do you play when you need confidence?",
    category: "scenario"
  },
  {
    text: "What song do you play when you're alone and no one's watching?",
    category: "scenario"
  },
  {
    text: "What song makes housework bearable?",
    category: "scenario"
  },
  {
    text: "What's your ultimate shower song?",
    category: "scenario"
  },
  // Artist/Band Specific (but still personal choice)
  {
    text: "What's the most underrated song by a famous artist?",
    category: "artist"
  },
  {
    text: "What artist (pick your favorite song) do you wish you could see live?",
    category: "artist"
  },
  {
    text: "What song completely changed your music taste?",
    category: "artist"
  },
  // Generational/Era
  {
    text: "What 90s song still slaps today?",
    category: "era"
  },
  {
    text: "What's the best song from the 80s?",
    category: "era"
  },
  {
    text: "What modern song will be a classic in 20 years?",
    category: "era"
  },
  // Deep Cuts
  {
    text: "What song do you wish more people knew about?",
    category: "discovery"
  },
  {
    text: "What song changed your life?",
    category: "discovery"
  },
  {
    text: "What song introduced you to a whole new genre?",
    category: "discovery"
  },
  {
    text: "What's a song you discovered by accident but now love?",
    category: "discovery"
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