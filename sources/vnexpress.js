const Parser = require('rss-parser');
const parser = new Parser();
const { randomUUID: uuidv4 } = require('crypto');

/**
 * VNExpress RSS fetcher
 * @param {string} feedUrl
 * @param {string} topic
 */
async function fetchVnexpress(feedUrl, topic) {
  try {
    const feed = await parser.parseURL(feedUrl);

    return feed.items.map(item => ({
      id: uuidv4(),
      source_url: item.link,
      title: item.title,
      content: item.contentSnippet || item.content || '',
      topic,
      image_url: item.enclosures && item.enclosures[0] ? item.enclosures[0].url : '',
      source: 'vnexpress',
      published_at: item.pubDate
    }));
  } catch (error) {
    console.error('Error fetching VNExpress RSS:', error);
    return [];
  }
}

module.exports = { fetchVnexpress };
