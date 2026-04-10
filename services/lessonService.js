
const db = require('../src/firebase');

async function saveLesson(lesson) {
  const ref = db.collection('lessons').doc(lesson.id);

  const doc = await ref.get();
  if (doc.exists) {
    console.log('Lesson exists, skip:', lesson.id);
    return;
  }

  await ref.set({
    title: lesson.title,
    text: lesson.text,
    topic: lesson.topic,
    level: lesson.level,
    reading_time: lesson.reading_time,
    source_url: lesson.source_url,
    published_at: lesson.published_at,
    image_url: lesson.image_url,
  });
  
}

module.exports = { saveLesson };
