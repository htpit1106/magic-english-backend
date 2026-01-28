const axios = require('axios');

const API_KEY = '06c07639f6b34f989ff8454a61b99183';

async function fetchArticles(topic) {
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
    id: a.url,
    title: a.title,
    content: a.content || '',
    topic,
    source: 'newsapi',
    published_at: a.publishedAt
  }));
}

module.exports = { fetchArticles };
