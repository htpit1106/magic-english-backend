const { saveArticle } = require('../services/articleService');
const { articleToLesson } = require('../services/articleToLesson');
const { saveLesson } = require('../services/lessonService');
const { tokenize } = require('../services/tokenize');
const { prewarmVocabulary } = require('../services/vocabService');
const sources = require('../sources/sources.js');
async function fetchAndSave() {
  console.log('🚀 Fetching articles...');

  for (const s of sources) {
    let articles = [];

    try {
      articles = await s.fetch(); // gọi fetch của source
    } catch (err) {
      console.error(`❌ Source failed: ${s.source}-${s.topic}`, err.message);
      continue;
    }

    if (!Array.isArray(articles)) {
      console.error(`❌ ${s.source}-${s.topic} did not return array`);
      continue;
    }

    // Lấy tối đa 2 bài viết mới nhất để tránh quá tải và timeout
    const articlesToProcess = articles.slice(0, 2);

    for (const article of articlesToProcess) {
      try {
        const isNew = await saveArticle(article);
        if (!isNew) {
          console.log(`⏭️ [${s.source}-${s.topic}] Article already exists, skip:`, article.title);
          continue;
        }

        const lesson = await articleToLesson(article);
        const words = [...new Set(tokenize(lesson.text))];

        await saveLesson(lesson);

        await prewarmVocabulary(words).catch(err =>
          console.error('⚠️ vocab prewarm failed:', err.message)
        );

        console.log(`📘 [${s.source}-${s.topic}] Lesson created:`, lesson.title);

      } catch (err) {
        console.error('❌ Failed to create lesson:', article.id, err.message);
      }
    }
  }

  console.log('✅ Done fetching & lesson creation');
}

module.exports = {
  fetchAndSave
};
