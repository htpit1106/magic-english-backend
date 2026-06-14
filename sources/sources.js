const { fetchNewsApiArt } = require('./newsApi.js');
const { fetchBbc } = require('./bbc.js');

// Nguồn mặc định — dùng làm fallback nếu Firestore chưa có rss_sources
const DEFAULT_SOURCES = [
  {
    source: 'newsapi', topic: 'technology',
    fetch: () => fetchNewsApiArt('technology')
  },
  {
    source: 'bbc', topic: 'technology',
    fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/technology/rss.xml', 'technology')
  },
  {
    source: 'bbc', topic: 'business',
    fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/business/rss.xml', 'business')
  },
  {
    source: 'bbc', topic: 'news',
    fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/rss.xml', 'news')
  },
  {
    source: 'bbc', topic: 'science',
    fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 'science')
  },
  {
    source: 'bbc', topic: 'sports',
    fetch: () => fetchBbc('https://feeds.bbci.co.uk/sport/rss.xml', 'sports')
  },
  {
    source: 'bbc', topic: 'health',
    fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/health/rss.xml', 'health')
  }
];

// Lấy sources từ Firestore (collection rss_sources) + merge với DEFAULT_SOURCES.
// Nếu Firestore trống thì chỉ dùng defaults.
async function getSources() {
  try {
    const db = require('../src/firebase');
    const snapshot = await db.collection('rss_sources').where('active', '==', true).get();
    if (snapshot.empty) return DEFAULT_SOURCES;

    const firestoreSources = snapshot.docs.map(doc => {
      const { url, topic, name } = doc.data();
      return {
        source: name || url,
        topic,
        fetch: () => fetchBbc(url, topic),
      };
    });

    return [...DEFAULT_SOURCES, ...firestoreSources];
  } catch (err) {
    console.error('⚠️ Could not load rss_sources from Firestore, using defaults:', err.message);
    return DEFAULT_SOURCES;
  }
}

module.exports = DEFAULT_SOURCES;
module.exports.getSources = getSources;
