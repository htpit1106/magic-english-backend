require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Health check - KHÔNG đụng Firebase/AI. Nếu route này sống mà route khác chết
// thì lỗi nằm ở Firebase env/key; nếu route này cũng chết thì function crash lúc khởi động.
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    env: {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || null,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      privateKeyStartsWithBegin: (process.env.FIREBASE_PRIVATE_KEY || '').includes('BEGIN'),
      privateKeyHasLiteralBackslashN: (process.env.FIREBASE_PRIVATE_KEY || '').includes('\\n'),
      privateKeyHasRealNewline: (process.env.FIREBASE_PRIVATE_KEY || '').includes('\n')
    }
  });
});

// require('../cron/fetchArticles');
const { fetchAndSave } = require('../cron/fetchArticles');

app.get('/api/cron', async (req, res) => {
  try {
    await fetchAndSave();
    res.send('Cron job executed');
  } catch (err) {
    console.error(err);
    res.status(500).send('Cron failed');
  }
});

// routes
const articlesRoute = require('../route/articles.route');
app.use('/api/articles', articlesRoute);

const lessonsRoute = require('../route/lessons.route');
app.use('/api/lessons', lessonsRoute);

const userRoute = require('../route/user.route');
app.use('/api/users', userRoute);

const quizRoute = require('../route/quiz.route');
app.use('/api', quizRoute);

const writingRoute = require('../route/writing.route');
app.use('/api/writing', writingRoute);

const sourcesRoute = require('../route/sources.route');
app.use('/api/sources', sourcesRoute);

// define word
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



// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 🔥 QUAN TRỌNG NHẤT
module.exports = app;