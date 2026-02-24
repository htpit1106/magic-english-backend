// selection lesson by topic
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/lessons?topic=your_topic
router.get('/', (req, res) => {
  const { topic, limit = 10 } = req.query;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  const lessons = db.prepare(`
    SELECT 
      *
    FROM lessons
    WHERE topic = ?
    ORDER BY published_at DESC
    LIMIT ?
  `).all(topic, Number(limit));

  res.json(lessons);
});

// GET /api/lessons/:id
router.get('/:id', (req, res) => {
  const id = decodeURIComponent(req.params.id);

  const lesson = db.prepare(`
    SELECT * FROM lessons WHERE id = ?
  `).get(id);

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  res.json(lesson);
});

module.exports = router;