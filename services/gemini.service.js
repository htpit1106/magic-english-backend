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

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
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

async function generateWritingLesson({ topic, level }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an English Writing Lesson Expert.

Generate a writing lesson in JSON format.

Input:
- Topic: ${topic}
- CEFR Level: ${level}

Requirements:
1. Create a realistic scenario.
2. Create a writing task.
3. Generate 3-5 writing requirements.
4. Generate 5-10 useful vocabulary words.
5. Suggest a minimum and maximum word count.
6. The lesson must match the CEFR level.
7. The topic must be appropriate (no sexual, political, hateful, violent or illegal content). If the topic is inappropriate, set "title" to "REJECTED" and leave other fields empty.
8. Return JSON only.

Output Format:
{
  "title": "",
  "level": "",
  "scenario": "",
  "task": "",
  "requirements": [],
  "sampleVocabulary": [],
  "wordLimit": { "min": 0, "max": 0 }
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonText = extractJson(text);

  try {
    const parsed = JSON.parse(jsonText);

    return {
      title: parsed.title || topic,
      level: parsed.level || level,
      scenario: parsed.scenario || '',
      task: parsed.task || '',
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      sampleVocabulary: Array.isArray(parsed.sampleVocabulary) ? parsed.sampleVocabulary : [],
      wordLimit: {
        min: Number(parsed.wordLimit?.min) || 0,
        max: Number(parsed.wordLimit?.max) || 0
      }
    };
  } catch (err) {
    console.error('Parse error:', text);
    console.error('Gemini generation failed:', err.message);

    throw new Error(`Failed to generate writing lesson: ${err.message}`);
  }
}

async function evaluateWriting({ topic, level, content }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an English Writing Evaluator.

Evaluate the student's writing.

Topic: ${topic || 'N/A'}
Target CEFR Level: ${level || 'N/A'}

Student's writing:
"""
${content}
"""

Provide:
- Grammar Score (0-100)
- Vocabulary Score (0-100)
- Task Completion Score (0-100)
- Overall Score (0-100)
- Estimated CEFR Level
- Strengths
- Mistakes
- Improved Version

Return JSON only.

Output Format:
{
  "grammarScore": 0,
  "vocabularyScore": 0,
  "taskCompletionScore": 0,
  "overallScore": 0,
  "estimatedCEFRLevel": "",
  "strengths": [],
  "mistakes": [],
  "improvedVersion": ""
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonText = extractJson(text);

  try {
    const parsed = JSON.parse(jsonText);

    return {
      grammarScore: Number(parsed.grammarScore) || 0,
      vocabularyScore: Number(parsed.vocabularyScore) || 0,
      taskCompletionScore: Number(parsed.taskCompletionScore) || 0,
      overallScore: Number(parsed.overallScore) || 0,
      estimatedCEFRLevel: parsed.estimatedCEFRLevel || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      improvedVersion: parsed.improvedVersion || ''
    };
  } catch (err) {
    console.error('Parse error:', text);
    console.error('Gemini evaluation failed:', err.message);

    throw new Error(`Failed to evaluate writing: ${err.message}`);
  }
}

module.exports = { generateQuizFromWord, generateWritingLesson, evaluateWriting };