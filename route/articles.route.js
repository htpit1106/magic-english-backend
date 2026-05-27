const express = require('express');
const router = express.Router();
const db = require('../src/firebase');

/// GET /api/lessons?topic=...
router.get('/', async (req, res) => {
  try {
    const { topic, limit = 10 } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Missing topic' });
    }

    const snapshot = await db
      .collection('lessons')
      .where('topic', '==', topic)
      .orderBy('published_at', 'desc')
      .limit(Number(limit))
      .get();

    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(lessons);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;