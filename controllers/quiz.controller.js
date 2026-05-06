const db = require('../src/firebase');
const { getOrCreateQuizzes } = require('../services/quiz.service');

function normalizeWordId(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.toLowerCase().trim();
}

function normalizeVocabItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const rawWordId = item.id || item.wordId || item.word || item.term || item.vocabId;
  const wordId = normalizeWordId(rawWordId);

  if (!wordId) {
    return null;
  }

  return {
    id: wordId,
    word: typeof item.word === 'string' ? item.word : wordId,
    meanings: Array.isArray(item.meanings) ? item.meanings : [],
    raw: item
  };
}

function extractVocabList(body) {
  const payload = body && typeof body === 'object' ? body : {};

  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload.word && typeof payload.word === 'object') {
    return [payload.word];
  }

  if (typeof payload.wordId === 'string' || typeof payload.word === 'string') {
    return [{
      id: payload.wordId || payload.word,
      word: payload.word || payload.wordId,
      meanings: Array.isArray(payload.meanings) ? payload.meanings : []
    }];
  }

  return payload.words || payload.vocabs || payload.learnedVocabs || payload.vocabList || payload.items || [];
}

function getUserId(req) {
  return req.user?.id || req.body?.userId || req.query.userId || '';
}

async function getQuiz(req, res) {
  try {
    const userId = getUserId(req);
    const rawList = extractVocabList(req.body);
    const vocabList = rawList.map(normalizeVocabItem).filter(Boolean);

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (vocabList.length === 0) {
      return res.status(400).json({ error: 'Missing vocab list' });
    }

    const results = await getOrCreateQuizzes(userId, vocabList);

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

async function getDueQuiz(req, res) {
  try {
    const userId = getUserId(req);
    const maxPerDay = Number(req.query.maxPerDay || req.body?.maxPerDay || 20);
    const now = new Date().toISOString();

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('learned_vocab')
      .where('nextReview', '<=', now)
      .orderBy('nextReview')
      .limit(Number.isNaN(maxPerDay) ? 20 : maxPerDay)
      .get();

    const vocabList = snapshot.docs
      .map(doc => normalizeVocabItem({
        id: doc.id,
        ...doc.data()
      }))
      .filter(Boolean);

    if (vocabList.length === 0) {
      return res.json([]);
    }

    const results = await getOrCreateQuizzes(userId, vocabList);

    return res.json(results);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { getQuiz, getDueQuiz };