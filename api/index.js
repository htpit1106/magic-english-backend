require('dotenv').config();

const express = require('express');
const app = express();

app.use(express.json());

// ❌ bỏ cron
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

// ❌ bỏ download db
// app.get('/debug/download-db', ...)

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 🔥 QUAN TRỌNG NHẤT
module.exports = app;