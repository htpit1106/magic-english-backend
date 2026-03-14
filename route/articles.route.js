const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/les?topic=your_topic
router.get('/', (req, res) => {
  const { topic } = req.query;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  const lessons = db.prepare(`
    SELECT *
    FROM lessons
    WHERE topic = ?
    ORDER BY published_at DESC
    LIMIT 50
  `).all(topic);

  res.json(lessons);
});

module.exports = router;