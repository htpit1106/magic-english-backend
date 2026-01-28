const axios = require('axios');
const db = require('../db');

async function prewarmVocabulary(words) {
  for (const word of words) {
    const exists = db
      .prepare('SELECT word FROM vocabulary WHERE word = ?')
      .get(word);

    if (exists) continue;

    try {
      const res = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );

      const entry = res.data[0];

      const phonetic =
        entry.phonetic ||
        entry.phonetics?.find(p => p.text)?.text ||
        null;

      const audio =
        entry.phonetics?.find(p => p.audio)?.audio ||
        null;

      const meaning =
        entry.meanings?.[0]?.definitions?.[0]?.definition ||
        null;

      const example =
        entry.meanings?.[0]?.definitions?.[0]?.example ||
        `This is an example sentence using the word "${word}".`;

      db.prepare(`
        INSERT INTO vocabulary
        (word, phonetic, audio, meaning, example, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        word,
        phonetic,
        audio,
        meaning,
        example,
        new Date().toISOString()
      );

    } catch (e) {
      // ignore words not found
    }
  }
}

module.exports = { prewarmVocabulary };
