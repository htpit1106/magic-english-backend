const { htmlToText } = require('html-to-text');

function cleanText(html) {
  return htmlToText(html, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'a', options: { ignoreHref: true } }
    ]
  });
}

module.exports = { cleanText };
