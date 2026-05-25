const Parser = require('rss-parser');
const parser = new Parser();

async function testUrl(url) {
  try {
    const feed = await parser.parseURL(url);
    console.log(`\n=== SUCCESS: ${url} ===`);
    console.log(`Feed Title: ${feed.title}`);
    if (feed.items && feed.items.length > 0) {
      console.log('First item title:', feed.items[0].title);
      console.log('First item keys:', Object.keys(feed.items[0]));
      console.log('First item enclosure:', feed.items[0].enclosure);
      console.log('First item content snippet:', feed.items[0].contentSnippet);
    }
  } catch (err) {
    console.log(`\n=== FAILED: ${url} ===`);
    console.log('Error:', err.message);
  }
}

async function run() {
  await testUrl('https://vnexpress.net/rss/technology.rss');
  await testUrl('https://vnexpress.net/rss/so-hoa.rss');
  await testUrl('https://e.vnexpress.net/rss/news.rss');
}

run();
