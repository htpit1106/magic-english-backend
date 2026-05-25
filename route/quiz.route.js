const express = require('express');
const router = express.Router();
const { getQuiz, getDueQuiz } = require('../controllers/quiz.controller');

// api use for create quiz from words
// that crer
router.post('/quiz', getQuiz);

// use for getting due quiz
router.get('/quiz/due', getDueQuiz);

module.exports = router;
