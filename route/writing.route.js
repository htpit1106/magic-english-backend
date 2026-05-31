const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { generateWritingLesson, evaluateWriting } = require('../services/gemini.service');

// Lazy Firebase: chỉ truy cập db BÊN TRONG handler (đã có try/catch), không ở top-level,
// và không dùng package uuid -> tránh crash function lúc import như trước.
const db = require('../src/firebase');

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

    // Lưu bài học vào Firebase. Lỗi lưu không được làm hỏng response.
    try {
      await db.collection('writing_lessons').doc(id).set({
        ...result,
        created_at: new Date().toISOString()
      });
    } catch (saveErr) {
      console.error('Save lesson failed:', saveErr.message);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST /api/writing/evaluate  { lessonId, content, userId }
router.post('/evaluate', async (req, res) => {
  try {
    const { lessonId, content, userId } = req.body || {};

    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }

    // Lấy lại lesson từ Firebase để có topic/level làm ngữ cảnh chấm điểm
    let lesson = null;
    if (lessonId) {
      try {
        const doc = await db.collection('writing_lessons').doc(lessonId).get();
        if (doc.exists) lesson = doc.data();
      } catch (readErr) {
        console.error('Read lesson failed:', readErr.message);
      }
    }

    const result = await evaluateWriting({
      topic: lesson?.topic,
      level: lesson?.level,
      content
    });

    const submissionId = `sub_${crypto.randomUUID()}`;
    const submission = {
      id: submissionId,
      userId: userId || null,
      lessonId: lessonId || null,
      topic: lesson?.topic || null,
      level: lesson?.level || null,
      content,
      ...result,
      created_at: new Date().toISOString()
    };

    // Lưu lịch sử bài làm. Lỗi lưu không được làm hỏng response.
    try {
      await db.collection('writing_submissions').doc(submissionId).set(submission);
    } catch (saveErr) {
      console.error('Save submission failed:', saveErr.message);
    }

    res.json(submission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/writing/history?userId=...&limit=20
// Lấy lại các bài người học đã viết (lịch sử làm bài)
router.get('/history', async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const snapshot = await db
      .collection('writing_submissions')
      .where('userId', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .get();

    res.json(snapshot.docs.map(doc => doc.data()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET /api/writing/lessons?level=A2&limit=20
// Lấy các bài viết người khác đã tạo (khi người học không biết viết chủ đề gì)
router.get('/lessons', async (req, res) => {
  try {
    const { level, limit = 20 } = req.query;

    let query = db.collection('writing_lessons');
    if (level) {
      query = query.where('level', '==', level);
    }
    query = query.orderBy('created_at', 'desc').limit(Number(limit));

    const snapshot = await query.get();
    res.json(snapshot.docs.map(doc => doc.data()));
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
