const { fetchFullArticle } = require('./fetchFullArticle');
const { cleanText } = require('./cleanText');
const { shortenText } = require('./shortenText');

async function articleToLesson(article) {
  const html = await fetchFullArticle(article.sourceUrl);
  const clean = cleanText(html);
  const text = shortenText(clean);

  const lesson =  {
    id: article.id,  
    title: article.title,
    text,
    topic: article.topic,
    level: 'B1',
    reading_time: Math.ceil(text.split(' ').length / 200),
    source_url: article.sourceUrl,
    published_at: article.published_at,
    image_url: article.image_url
  };

  return lesson;
}

module.exports = { articleToLesson };
