function shortenText(text, maxWords = 400) {
  const words = text.split(/\s+/);
  return words.slice(0, maxWords).join(' ');
}

module.exports = { shortenText };
