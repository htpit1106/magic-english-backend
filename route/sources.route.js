const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../src/firebase');

// GET /api/sources — danh sách tất cả RSS sources
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('rss_sources').orderBy('created_at', 'desc').get();
    const sources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(sources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/sources — thêm nguồn RSS mới
router.post('/', async (req, res) => {
  try {
    const { url, topic, name } = req.body;
    if (!url || !topic) return res.status(400).json({ error: 'Missing url or topic' });

    const id = `src_${crypto.randomUUID()}`;
    const source = {
      url: url.trim(),
      topic: topic.trim(),
      name: name || url.trim(),
      type: 'rss',
      active: true,
      created_at: new Date().toISOString(),
    };

    await db.collection('rss_sources').doc(id).set(source);
    res.status(201).json({ id, ...source });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/sources/:id — bật/tắt hoặc đổi tên
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['active', 'name', 'topic'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });
    await db.collection('rss_sources').doc(id).set(update, { merge: true });
    const doc = await db.collection('rss_sources').doc(id).get();
    res.json({ id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/sources/:id — xóa nguồn
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('rss_sources').doc(id).delete();
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
