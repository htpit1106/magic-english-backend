require('dotenv').config();
// log "hello world" to the console
console.log("hello world");
// ===== 1. IMPORT =====
const express = require('express');
const app = express();

// ===== 2. MIDDLEWARE =====
// purpose 
app.use(express.json());

// ===== 3. INIT CRON =====
require('../cron/fetchArticles');

// ===== 4. ROUTES =====

const articlesRoute = require('../route/articles.route');
app.use('/api/articles', articlesRoute);

const lessonsRoute = require('../route/lessons.route');
app.use('/api/lessons', lessonsRoute);

const  userRoute  = require('../route/user.route');
app.use('/api/users', userRoute);


// ===== word =====
const { defineWord } = require('../services/defineService');

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
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== db. ====
const db = require('../db');
app.get('/debug/db', (req, res) => {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table';
  `).all();

  const lessons = db.prepare(`
    SELECT * FROM lessons LIMIT 5;
  `).all();

  res.json({ tables, lessons });
});
// ===== 5. START SERVER (BẮT BUỘC) =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at ${PORT}`);
});
