const express = require('express');
const router = express.Router();
const { getQuiz, getDueQuiz } = require('../controllers/quiz.controller');

router.post('/quiz', getQuiz);
router.get('/quiz/due', getDueQuiz);

module.exports = router;