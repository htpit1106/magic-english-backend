const { fetchFullArticle } = require('./fetchFullArticle');
const { cleanText } = require('./cleanText');
const { shortenText } = require('./shortenText');
const { v4: uuidv4 } = require('uuid');

async function articleToLesson(article) {
  const html = await fetchFullArticle(article.id);
  const clean = cleanText(html);
  const text = shortenText(clean);

  const lesson =  {
    id: uuidv4(),  
    title: article.title,
    text,
    topic: article.topic,
    level: 'B1',
    reading_time: Math.ceil(text.split(' ').length / 200),
    source_url: article.id,
    published_at: article.published_at
  };

  return lesson;
}

module.exports = { articleToLesson };

// Lây phan đầu và phần thân bài