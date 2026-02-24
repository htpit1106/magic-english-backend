const db = require('../db');

function saveArticle(article) {
  const exists = db
    .prepare('SELECT id FROM articles WHERE sourceUrl = ?')
    .get(article.sourceUrl);

  if (exists) return;

  db.prepare(`
    INSERT INTO articles (id, sourceUrl, title, content, topic, source, published_at, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    article.id,
    article.sourceUrl,
    article.title,
    article.content,
    article.topic,
    article.source,
    article.published_at,
    article.image_url
  );
}

module.exports = { saveArticle };
