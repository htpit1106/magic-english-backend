const express = require('express');
const router = express.Router();
const db = require('../src/firebase');
const {
  generateLesson,
  evaluateWriting,
  getSubmissionHistory,
  listLessons,
  moderateContent,
  ModerationError
} = require('../services/writingService');

// POST /api/writing/moderate - kiểm duyệt nhanh chủ đề/nội dung (Flutter gọi khi user gõ)
router.post('/moderate', async (req, res) => {
  try {
    const { text, kind } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: 'Missing text' });
    }

    await moderateContent(text, { kind: kind === 'content' ? 'content' : 'topic' });
    res.json({ allowed: true });
  } catch (err) {
    if (err instanceof ModerationError) {
      return res.json({
        allowed: false,
        message: err.message,
        categories: err.categories
      });
    }
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/writing/generate-lesson
router.post('/generate-lesson', async (req, res) => {
  try {
    const { topic, level } = req.body || {};

    if (!topic || !level) {
      return res.status(400).json({ error: 'Missing topic or level' });
    }

    const lesson = await generateLesson({ topic, level });
    res.json(lesson);
  } catch (err) {
    console.error(err);
    if (err instanceof ModerationError) {
      return res.status(422).json({
        error: 'CONTENT_REJECTED',
        message: err.message,
        categories: err.categories
      });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/writing/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { lessonId, content, userId } = req.body || {};

    if (!lessonId || !content) {
      return res.status(400).json({ error: 'Missing lessonId or content' });
    }

    const result = await evaluateWriting({ lessonId, content, userId });
    res.json(result);
  } catch (err) {
    console.error(err);
    if (err instanceof ModerationError) {
      return res.status(422).json({
        error: 'CONTENT_REJECTED',
        message: err.message,
        categories: err.categories
      });
    }
    if (err.message === 'Lesson not found') {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/writing/history?userId=...&limit=...
router.get('/history', async (req, res) => {
  try {
    const { userId, limit } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const history = await getSubmissionHistory({ userId, limit });
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/writing/lessons?level=A2&limit=20
// Danh sách bài học có sẵn (do người khác đã tạo) để user chọn khi chưa biết viết gì
router.get('/lessons', async (req, res) => {
  try {
    const { level, limit } = req.query;
    const lessons = await listLessons({ level, limit });
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/writing/lessons/:id - chi tiết 1 bài học
router.get('/lessons/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const doc = await db.collection('writing_lessons').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(doc.data());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

module.exports = router;
