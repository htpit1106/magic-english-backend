const db = require('../src/firebase');

async function defineWord(word) {
  word = word.toLowerCase().trim();

  if (!/^[a-z]+$/.test(word)) {
    throw new Error('Invalid word');
  }

  const doc = await db.collection('vocabulary').doc(word).get();

  if (!doc.exists) {
    throw new Error('Word not found');
  }

  return doc.data();
}

module.exports = { defineWord };