const db = require('../db');

async function defineWord(word) {
  word = word.toLowerCase().trim();

  if (!/^[a-z]+$/.test(word)) {
    throw new Error('Invalid word');
  }

  const vocab = db
    .prepare('SELECT * FROM vocabulary WHERE word = ?')
    .get(word);

  if (!vocab) {
    throw new Error('Word not found');
  }

  return vocab;
}

module.exports = { defineWord };
