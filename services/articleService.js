const db = require('../src/firebase.js');

async function saveArticle(article) {
  const ref = db.collection('articles;').doc(article.id);
  const doc = await ref.get();
  if(doc.exists) return;

  await ref.set({
    source_url: article.source_url,
    title: article.title,
    content: article.content,
    topic: article.topic,
    source: article.source,
    published_at: article.published_at,
    image_url: article.image_url
  
  })
}

module.exports = { saveArticle };
