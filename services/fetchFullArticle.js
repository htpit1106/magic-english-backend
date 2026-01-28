const axios = require('axios');
const Mercury = require('@postlight/parser');

async function fetchFullArticle(url) {
  const html = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  const result = await Mercury.parse(url, {
    html: html.data
  });

  return result.content; // HTML đã lọc quảng cáo
}

module.exports = { fetchFullArticle };
