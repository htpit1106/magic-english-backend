const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../src/firebase');

// GET /api/lessons?topic=...&limit=50
// topic bỏ trống => lấy tất cả (dùng cho admin)
router.get('/', async (req, res) => {
  try {
    const { topic, limit = 50 } = req.query;

    let query = db.collection('lessons').orderBy('published_at', 'desc').limit(Number(limit));

    if (topic) {
      query = db.collection('lessons')
        .where('topic', '==', topic)
        .orderBy('published_at', 'desc')
        .limit(Number(limit));
    }

    const snapshot = await query.get();
    const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(lessons);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/lessons/:id
router.get('/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const doc = await db.collection('lessons').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/lessons  — tạo lesson mới (admin)
router.post('/', async (req, res) => {
  try {
    const { title, text, topic, level = 'B1', source_url = '', source = '', image_url = '' } = req.body;
    if (!title || !topic) return res.status(400).json({ error: 'Missing title or topic' });

    const id = `les_${crypto.randomUUID()}`;
    const words = (text || '').split(/\s+/).length;
    const reading_time = Math.max(1, Math.ceil(words / 200));

    const lesson = {
      title, text: text || '', topic, level, source_url, source, image_url,
      reading_time, published_at: new Date().toISOString(),
    };

    await db.collection('lessons').doc(id).set(lesson);
    res.status(201).json({ id, ...lesson });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/lessons/:id  — cập nhật lesson (admin)
router.put('/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const doc = await db.collection('lessons').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lesson not found' });

    const allowed = ['title', 'text', 'topic', 'level', 'source_url', 'source', 'image_url'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    if (update.text) {
      const words = update.text.split(/\s+/).length;
      update.reading_time = Math.max(1, Math.ceil(words / 200));
    }

    await db.collection('lessons').doc(id).set(update, { merge: true });
    const updated = await db.collection('lessons').doc(id).get();
    res.json({ id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/lessons/:id  — xóa lesson (admin)
router.delete('/:id', async (req, res) => {
  try {
    const id = decodeURIComponent(req.params.id);
    const doc = await db.collection('lessons').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lesson not found' });
    await db.collection('lessons').doc(id).delete();
    res.json({ ok: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
