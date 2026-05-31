const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { generateWritingLesson, evaluateWriting } = require('../services/gemini.service');

// In-memory store cho lesson vừa tạo (đủ để /evaluate lấy lại topic + level).
// KHÔNG dùng Firebase ở route này để tránh crash function (giống quiz dùng gemini.service).
const lessonStore = new Map();

// POST /api/writing/generate-lesson  { topic, level }
router.post('/generate-lesson', async (req, res) => {
  try {
    const { topic, level } = req.body || {};

    if (!topic || !level) {
      return res.status(400).json({ error: 'Missing topic or level' });
    }

    const lesson = await generateWritingLesson({ topic, level });

    if (lesson.title === 'REJECTED') {
      return res.status(422).json({
        error: 'CONTENT_REJECTED',
        message: 'Chủ đề không phù hợp với quy định của ứng dụng.'
      });
    }

    const id = `lesson_${crypto.randomUUID()}`;
    const result = { id, topic, ...lesson };
    lessonStore.set(id, result);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/writing/evaluate  { lessonId, content }
router.post('/evaluate', async (req, res) => {
  try {
    const { lessonId, content } = req.body || {};

    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }

    const lesson = lessonId ? lessonStore.get(lessonId) : null;

    const result = await evaluateWriting({
      topic: lesson?.topic,
      level: lesson?.level,
      content
    });

    res.json({ lessonId: lessonId || null, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
