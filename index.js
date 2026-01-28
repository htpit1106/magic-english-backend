// log "hello world" to the console
console.log("hello world");
// ===== 1. IMPORT =====
const express = require('express');
const app = express();
const db = require('./db');

// ===== 2. MIDDLEWARE =====
app.use(express.json());

// ===== 3. INIT CRON =====
require('./cron/fetchArticles');

// ===== 4. ROUTES =====
app.get('/api/articles', (req, res) => {
  const { topic } = req.query;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  const articles = db.prepare(`
    SELECT id, title, content, topic, source, published_at
    FROM articles
    WHERE topic = ?
    ORDER BY published_at DESC
    LIMIT 10
  `).all(topic);

  res.json(articles);
});

app.get('/api/debug/topics', (req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT topic FROM articles')
    .all();
  res.json(rows);
});
// ===== RECOMMEND FOR YOU =====
app.get('/api/recommend', (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  const user = db
    .prepare('SELECT topics FROM users WHERE id = ?')
    .get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const topics = JSON.parse(user.topics);
  const placeholders = topics.map(() => '?').join(',');

  const articles = db.prepare(`
    SELECT id, title, content, topic, source, published_at
    FROM articles
    WHERE topic IN (${placeholders})
    ORDER BY published_at DESC
    LIMIT 10
  `).all(...topics);

  res.json(articles);
});

// ===== USER (ONBOARDING) =====
app.post('/api/users', (req, res) => {
  const { userId, topics } = req.body;

  if (!userId || !Array.isArray(topics)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  db.prepare(`
    INSERT OR REPLACE INTO users (id, topics)
    VALUES (?, ?)
  `).run(userId, JSON.stringify(topics));

  res.json({ success: true });
});

// ===== LESSON LIST =====
app.get('/api/lessons', (req, res) => {
  const { topic, limit = 10 } = req.query;

  if (!topic) {
    return res.status(400).json({ error: 'Missing topic' });
  }

  const lessons = db.prepare(`
    SELECT 
      id,
      title,
      topic,
      level,
      reading_time
    FROM lessons
    WHERE topic = ?
    ORDER BY published_at DESC
    LIMIT ?
  `).all(topic, Number(limit));

  res.json(lessons);
});

/// ===== LESSON DETAIL =====
app.get('/api/lessons/:id', (req, res) => {
  const id = decodeURIComponent(req.params.id);

  const lesson = db.prepare(`
    SELECT * FROM lessons WHERE id = ?
  `).get(id);

  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  res.json(lesson);
});

// ===== word =====
const { defineWord } = require('./services/defineService');

app.get('/api/define', async (req, res) => {
  try {
    const { word } = req.query;
    if (!word) return res.status(400).json({ error: 'Missing word' });

    const result = await defineWord(word);
    res.json(result);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// ===== 5. START SERVER (BẮT BUỘC) =====
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

