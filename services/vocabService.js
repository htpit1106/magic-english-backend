const db = require('../src/firebase');
const axios = require("axios");


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
    const word = raw.toLowerCase().replace(/[^a-z]/g,"");

    if (!word || word.length < 3) continue;

    const ref = db.collection('vocabulary').doc(word);
    const doc = await ref.get();

    if (doc.exists) continue;

    try {
      const res = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
      );

      const entry = res.data[0];

      await ref.set({
        phonetic: entry.phonetic || null,
        audio: entry.phonetics?.[0]?.audio || null,
        meanings: entry.meanings,
        created_at: new Date().toISOString()
      });

      console.log("Inserted:", word);

    } catch (e) {
      console.log("Error word:", word);
    }
  }
}

module.exports = { prewarmVocabulary };