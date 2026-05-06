const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function normalizeMeaningText(meanings) {
  if (!Array.isArray(meanings) || meanings.length === 0) {
    return [];
  }

  return meanings
    .map(meaning => {
      if (typeof meaning === 'string') {
        return meaning.trim();
      }

      const parts = [];

      if (meaning.partOfSpeech) {
        parts.push(meaning.partOfSpeech);
      }

      if (Array.isArray(meaning.definitions)) {
        meaning.definitions.forEach(definition => {
          if (definition && definition.definition) {
            parts.push(definition.definition);
          }
        });
      }

      if (Array.isArray(meaning.meanings)) {
        meaning.meanings.forEach(item => {
          if (typeof item === 'string') {
            parts.push(item);
          }
        });
      }

      return parts.join(' - ').trim();
    })
    .filter(Boolean);
}

function extractJson(text) {
  const trimmed = text.trim();

  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();
  }

  return trimmed;
}

async function generateQuizFromWord(wordData) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const meanings = normalizeMeaningText(wordData.meanings);

  const prompt = `
You are an English teacher.

Create 2 quizzes from this word:

Word: ${wordData.word || wordData.id}
Meanings: ${meanings.join(', ') || 'No meanings provided'}

Requirements:
- 1 multiple choice (4 options)
- 1 fill in the blank
- Use simple English
- Return JSON only

Format:
[
  {
    "type": "mcq",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "...",
    "explanation": "..."
  },
  {
    "type": "fill_blank",
    "question": "...",
    "correctAnswer": "...",
    "explanation": "..."
  }
]
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonText = extractJson(text);

  try {
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      throw new Error('Invalid AI response shape');
    }

    return parsed.map(item => ({
      type: item.type,
      question: item.question,
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswer: item.correctAnswer,
      explanation: item.explanation
    }));
  } catch (err) {
    console.error('Parse error:', text);
    console.error('Gemini generation failed:', err.message);

    throw new Error(`Failed to generate quiz: ${err.message}`);
  }
}

module.exports = { generateQuizFromWord };