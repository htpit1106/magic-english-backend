const db = require('../db');

function saveArticle(article) {
  const exists = db
    .prepare('SELECT id FROM articles WHERE id = ?')
    .get(article.id);

  if (exists) return;

  db.prepare(`
    INSERT INTO articles (id, title, content, topic, source, published_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    article.id,
    article.title,
    article.content,
    article.topic,
    article.source,
    article.published_at
  );
}

module.exports = { saveArticle };
