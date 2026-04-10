const express = require('express');
const router = express.Router();
const db = require('../src/firebase');
//post new user with topics
router.post('/', async (req, res) => {
  try {
    const { userId, topics } = req.body;

    if (!userId || !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    await db.collection('users').doc(userId).set(
      { topics },
      { merge: true }
    );

    res.status(201).json({ message: 'User updated successfully' });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// get lessson to recommend for user by their topics
router.get('/recommend', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { favorite_topic } = userDoc.data();

    if (!favorite_topic || favorite_topic.length === 0) {
      return res.json([]);
    }

    // ⚠️ Firestore giới hạn max 10 phần tử trong "in"
    const snapshot = await db
      .collection('lessons')
      .where('topic', 'in', favorite_topic.slice(0, 10))
      .orderBy('published_at', 'desc')
      .limit(100)
      .get();

    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(lessons);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;