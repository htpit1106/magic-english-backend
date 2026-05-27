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
  // Chuẩn hóa và làm sạch danh sách từ vựng, lọc bỏ stopwords
  const cleanWords = [...new Set(
    words
      .map(w => w.toLowerCase().replace(/[^a-z]/g, ""))
      .filter(w => w && w.length >= 3 && !stopwords.has(w))
  )];

  if (cleanWords.length === 0) return;

  const chunkSize = 100;
  const missingWords = [];

  // Truy vấn Firestore theo lô (Batch) 100 tài liệu một lúc để tối ưu hóa hiệu năng đọc
  for (let i = 0; i < cleanWords.length; i += chunkSize) {
    const chunk = cleanWords.slice(i, i + chunkSize);
    const refs = chunk.map(w => db.collection('vocabulary').doc(w));

    try {
      const docs = await db.getAll(...refs);
      docs.forEach((doc, idx) => {
        if (!doc.exists) {
          missingWords.push(chunk[idx]);
        }
      });
    } catch (err) {
      console.error("❌ Failed to bulk get words from Firestore:", err.message);
      // Fallback
      for (const w of chunk) {
        missingWords.push(w);
      }
    }
  }

  console.log(`🔍 Vocab: ${cleanWords.length} unique words, ${missingWords.length} missing in Firestore.`);

  // Giới hạn số lượng từ mới tải từ Dictionary API mỗi bài đọc (tối đa 15 từ) để tránh timeout và bị chặn IP
  const maxWordsToPrewarm = 15;
  const wordsToProcess = missingWords.slice(0, maxWordsToPrewarm);

  for (const word of wordsToProcess) {
    try {
      const res = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
        { timeout: 3000 }
      );

      if (res.data && res.data[0]) {
        const entry = res.data[0];

        await db.collection('vocabulary').doc(word).set({
          phonetic: entry.phonetic || null,
          audio: entry.phonetics?.[0]?.audio || null,
          meanings: entry.meanings,
          created_at: new Date().toISOString()
        });

        console.log("Inserted vocabulary:", word);
      }
      
      await sleep(100); // Tạm dừng 100ms để tránh spam API
    } catch (e) {
      console.log("Error word:", word, e.message);
    }
  }
}

module.exports = { prewarmVocabulary };