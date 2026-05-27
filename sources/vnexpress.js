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

    return feed.items.map(item => {
      let image_url = '';
      if (item.enclosure && item.enclosure.url) {
        image_url = item.enclosure.url;
      } else if (item.enclosures && item.enclosures[0] && item.enclosures[0].url) {
        image_url = item.enclosures[0].url;
      } else {
        const imgMatch = item.content ? item.content.match(/<img[^>]+src="([^">]+)"/) : null;
        if (imgMatch) {
          image_url = imgMatch[1];
        }
      }

      // Strip any HTML tags from contentSnippet/content to get clean text
      let cleanContent = item.contentSnippet || '';
      if (!cleanContent) {
        const tempContent = item.content || '';
        cleanContent = tempContent.replace(/<[^>]*>/g, '').trim();
      } else if (cleanContent.includes('<')) {
        cleanContent = cleanContent.replace(/<[^>]*>/g, '').trim();
      }

      return {
        id: uuidv4(),
        source_url: item.link,
        title: item.title,
        content: cleanContent,
        topic,
        image_url,
        source: 'vnexpress',
        published_at: item.pubDate
      };
    });
  } catch (error) {
    console.error('Error fetching VNExpress RSS:', error);
    return [];
  }
}

module.exports = { fetchVnexpress };
