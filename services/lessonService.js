
const db = require('../db');

function saveLesson(lesson) {
  db.prepare(`
    INSERT OR REPLACE INTO lessons
    (id, title, text, topic, level, reading_time, source_url, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    lesson.id,
    lesson.title,
    lesson.text,
    lesson.topic,
    lesson.level,
    lesson.reading_time,
    lesson.source_url,
    lesson.published_at
  );
  
}

module.exports = { saveLesson };
