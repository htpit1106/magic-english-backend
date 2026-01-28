const cron = require('node-cron');
const { fetchArticles } = require('../sources/newsApi');
const { saveArticle } = require('../services/articleService');
const { articleToLesson } = require('../services/articleToLesson');
const { saveLesson } = require('../services/lessonService');
const { tokenize } = require('../services/tokenize');
const { prewarmVocabulary } = require('../services/vocabService');

const TOPICS = ['technology', 'business'];

async function fetchAndSave() {
  console.log('🚀 Fetching articles...');

  for (const topic of TOPICS) {
    const articles = await fetchArticles(topic);

    for (const article of articles) {
      // 1️⃣ Lưu article gốc
      saveArticle(article);

      // 2️⃣ Tạo lesson từ article
      try {
        const lesson = await articleToLesson(article);
        const words = tokenize(lesson.text);

        // 3️⃣ Lưu lesson
        saveLesson(lesson);
         // 3️⃣ PREWARM VOCAB → CHẠY NỀN, KHÔNG AWAIT
            prewarmVocabulary(words).catch(err => {
            console.error('⚠️ vocab prewarm failed:', err.message);
        });
   


        console.log('📘 Lesson created:', lesson.title);
      } catch (err) {
        console.error('❌ Failed to create lesson:', article.id);
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
