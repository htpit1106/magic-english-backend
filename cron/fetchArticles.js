const cron = require('node-cron');
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

    for (const article of articles) {
      try {
        await saveArticle(article);

        const lesson = await articleToLesson(article);
        const words = tokenize(lesson.text);

        await saveLesson(lesson);

        prewarmVocabulary(words).catch(err =>
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

  /**
   * ✅ CHẠY NGAY KHI SERVER START
   */
  fetchAndSave();

  /**
   * ⏰ SAU ĐÓ CHẠY ĐỊNH KỲ
   */
  cron.schedule('0 */6 * * *', fetchAndSave);
