
const db = require('../db');

function saveLesson(lesson) {
  // check if lesson with the same id already exists
  const exists = db.prepare('SELECT 1 FROM lessons WHERE source_url = ?').get(lesson.source_url);
  if (exists) {
    console.log('ℹ Lesson already exists, skipping:', lesson.id);
    return;
  }
  db.prepare(`
    INSERT INTO lessons
    (id, title, text, topic, level, reading_time, source_url, published_at, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    lesson.id,
    lesson.title,
    lesson.text,
    lesson.topic,
    lesson.level,
    lesson.reading_time,
    lesson.source_url,
    lesson.published_at,
    lesson.image_url
  );
  
}

module.exports = { saveLesson };
