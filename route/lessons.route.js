// selection lesson by topic
const express = require('express');
const router = express.Router();
const db = require('../src/firebase');

// GET /api/lessons?topic=...
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

router.get('/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);

    const doc = await db.collection('lessons').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ id: doc.id, ...doc.data() });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;