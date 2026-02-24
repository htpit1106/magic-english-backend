const axios = require('axios');

const API_KEY =process.env.NEWS_API_KEY ;
const { v4: uuidv4 } = require('uuid');
async function fetchNewsApiArt(topic) {
  const res = await axios.get(
    'https://newsapi.org/v2/everything',
    {
      params: {
        q: topic,
        language: 'en',
        apiKey: API_KEY
      }
    }
  );

  return res.data.articles.map(a => ({
    id: uuidv4(),
    sourceUrl: a.url,
    title: a.title,
    content: a.content || '',
    topic,
    image_url: a.urlToImage || 'hi',
    source: 'newsapi',
    published_at: a.publishedAt
  }));
}

module.exports = { fetchNewsApiArt };
