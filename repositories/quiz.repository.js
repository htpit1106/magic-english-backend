const db = require('../src/firebase');

function buildQuizId(userId, wordId, type) {
  return [userId, wordId, type].join('__');
}

async function findByWord(userId, wordId) {
  const snapshot = await db
    .collection('quizzes')
    .where('userId', '==', userId)
    .where('wordId', '==', wordId)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function saveMany(quizzes) {
  const writes = quizzes.map(quiz => {
    const id = quiz.id || buildQuizId(quiz.userId, quiz.wordId, quiz.type);

    return db.collection('quizzes').doc(id).set({
      userId: quiz.userId,
      wordId: quiz.wordId,
      type: quiz.type,
      question: quiz.question,
      options: Array.isArray(quiz.options) ? quiz.options : [],
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation,
      createdAt: quiz.createdAt || new Date()
    }, { merge: true });
  });

  await Promise.all(writes);

  return quizzes;
}

module.exports = { findByWord, saveMany, buildQuizId };