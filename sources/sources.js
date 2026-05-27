const { fetchNewsApiArt } = require('./newsApi.js');
const { fetchBbc } = require('./bbc.js');

module.exports = [
    {
        source: 'newsapi',
        topic: 'technology',
        fetch: () => fetchNewsApiArt('technology')
    },
    {
        source: 'bbc',
        topic: 'technology',
        fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/technology/rss.xml', 'technology')
    },
    {
        source: 'bbc',
        topic: 'business',
        fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/business/rss.xml', 'business')
    },
    {
        source: 'bbc',
        topic: 'news',
        fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/rss.xml', 'news')
    },
    {
        source: 'bbc',
        topic: 'science',
        fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/science_and_environment/rss.xml', 'science')
    },
    {
        source: 'bbc',
        topic: 'sports',
        fetch: () => fetchBbc('https://feeds.bbci.co.uk/sport/rss.xml', 'sports')
    },
    {
        source: 'bbc',
        topic: 'health',
        fetch: () => fetchBbc('https://feeds.bbci.co.uk/news/health/rss.xml', 'health')
    }
]