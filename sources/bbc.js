const Parser = require('rss-parser');
const parser = new Parser();
const { randomUUID: uuidv4 } = require('crypto');

/**
 * BBC RSS fetcher generic
 * @param {string} feedUrl
 * @param {string} topic
 */
async function fetchBbc(feedUrl, topic) {
  const feed = await parser.parseURL(feedUrl);

  return feed.items.map(item => ({
    id: uuidv4(),
    source_url: item.link,
    title: item.title,
    content: item.contentSnippet || item.content || '',
    topic,
    image_url: '', // BBC RSS thường không có ảnh
    source: 'bbc',
    published_at: item.pubDate
  }));
}

module.exports = { fetchBbc };