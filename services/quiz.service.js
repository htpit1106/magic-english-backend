const quizRepo = require('../repositories/quiz.repository');
const { generateQuizFromWord } = require('./gemini.service');

const REQUIRED_TYPES = ['mcq', 'fill_blank'];

function normalizeQuiz(quiz) {
  return {
    id: quiz.id,
    userId: quiz.userId,
    wordId: quiz.wordId,
    type: quiz.type,
    question: quiz.question,
    options: Array.isArray(quiz.options) ? quiz.options : [],
    correctAnswer: quiz.correctAnswer,
    explanation: quiz.explanation,
    createdAt: quiz.createdAt
  };
}

function sortQuizzes(quizzes) {
  return [...quizzes].sort((left, right) => {
    return REQUIRED_TYPES.indexOf(left.type) - REQUIRED_TYPES.indexOf(right.type);
  });
}

function normalizeWord(word) {
  if (!word || typeof word !== 'object') {
    return null;
  }

  const id = typeof word.id === 'string' ? word.id.toLowerCase().trim() : '';
  const fallbackWord = typeof word.word === 'string' ? word.word.trim() : id;

  if (!id) {
    return null;
  }

  return {
    id,
    word: fallbackWord || id,
    meanings: Array.isArray(word.meanings) ? word.meanings : []
  };
}

async function getOrCreateQuiz(userId, word) {
  const normalizedWord = normalizeWord(word);

  if (!normalizedWord) {
    throw new Error('Invalid word payload');
  }

  const existing = await quizRepo.findByWord(userId, normalizedWord.id);

  const existingByType = new Map(existing.map(quiz => [quiz.type, quiz]));
  const hasAllRequiredTypes = REQUIRED_TYPES.every(type => existingByType.has(type));

  if (hasAllRequiredTypes) {
    return sortQuizzes(existing.map(normalizeQuiz));
  }

  const generated = await generateQuizFromWord(normalizedWord);

  const quizzesToSave = generated
    .filter(quiz => REQUIRED_TYPES.includes(quiz.type))
    .map(quiz => ({
      id: quizRepo.buildQuizId(userId, normalizedWord.id, quiz.type),
      userId,
      wordId: normalizedWord.id,
      type: quiz.type,
      question: quiz.question,
      options: Array.isArray(quiz.options) ? quiz.options : [],
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
      createdAt: new Date()
    }));

  if (quizzesToSave.length !== REQUIRED_TYPES.length) {
    throw new Error('AI did not generate the required quiz types');
  }

  await quizRepo.saveMany(quizzesToSave);

  const merged = new Map(existing.map(quiz => [quiz.type, normalizeQuiz(quiz)]));

  quizzesToSave.forEach(quiz => {
    merged.set(quiz.type, normalizeQuiz(quiz));
  });

  return sortQuizzes([...merged.values()]);
}

async function getOrCreateQuizzes(userId, words) {
  const results = [];

  for (const word of words) {
    const quizzes = await getOrCreateQuiz(userId, word);
    const normalizedWord = normalizeWord(word);

    if (normalizedWord) {
      results.push({
        wordId: normalizedWord.id,
        word: normalizedWord.word,
        quizzes
      });
    }
  }

  return results;
}

module.exports = { getOrCreateQuiz, getOrCreateQuizzes };