// server/models/Question.js
const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    text: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    }
  });
  
  module.exports = mongoose.model('Question', QuestionSchema);