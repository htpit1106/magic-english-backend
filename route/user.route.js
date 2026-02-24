const express = require('express');
const router = express.Router();
const db = require('../db');

//post new user with topics

router.post('/', (req, res) => {
 const { userId, topics } = req.body;
 
 if (!userId || !Array.isArray(topics)) {
   return res.status(400).json({ error: 'Invalid payload' });
 }
 db.prepare(`
    INSERT OR REPLACE INTO users (id, topics)
    VALUES (?, ?)
  `).run(userId, JSON.stringify(topics));
  res.status(201).json({ message: 'User created successfully' });
});

// get lessson to recommend for user by their topics
router.get('/recommend', (req, res) => {
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
    
    const lessons = db.prepare(`
    SELECT id, title, text, topic, level, reading_time, source_url, published_at
    FROM lessons
    WHERE topic IN (${placeholders})
    ORDER BY published_at DESC
    LIMIT 10
  `).all(...topics);
    
    res.json(lessons);
    });
    

module.exports = router;