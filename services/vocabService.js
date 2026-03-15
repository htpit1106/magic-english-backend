const axios = require("axios");
const db = require("../db");

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const stopwords = new Set([
"the","a","an","is","are","was","were","been","being",
"to","of","in","on","at","for","with","by","from",
"have","has","had","do","does","did","will","would",
"shall","should","may","might","must","can","could",
"not","both","like","know","things","sometimes"
]);

async function prewarmVocabulary(words) {

  for (let raw of words) {

    const word = raw
      .toLowerCase()
      .replace(/[^a-z]/g,"");

    if (!word) continue;
    if (word.length < 3) continue;
    if (stopwords.has(word)) continue;

    const exists = db
      .prepare("SELECT 1 FROM vocabulary WHERE word=?")
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

      const meanings = entry.meanings.map(m => ({
        partOfSpeech: m.partOfSpeech,
        definitions: m.definitions.map(d => ({
          definition: d.definition,
          example: d.example || null
        }))
      }));

      db.prepare(`
        INSERT INTO vocabulary
        (word, phonetic, audio, meanings, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        word,
        phonetic,
        audio,
        JSON.stringify(meanings),
        new Date().toISOString()
      );

      console.log("Inserted:", word);

      await sleep(1200);

    } catch (e) {

      if (e.response?.status === 429) {
        console.log("Rate limited → waiting 60s");
        await sleep(60000);
      }

      if (e.response?.status === 404) {
        console.log("No definition:", word);
      }

    }
  }
}

module.exports = { prewarmVocabulary };