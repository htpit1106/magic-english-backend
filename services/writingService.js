const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const db = require('../src/firebase');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

// Lỗi nội dung bị từ chối kiểm duyệt -> route trả 422
class ModerationError extends Error {
  constructor(reason, categories) {
    super(reason || 'Content rejected by moderation');
    this.name = 'ModerationError';
    this.categories = categories || [];
  }
}

// Kiểm duyệt nội dung do người học nhập (chủ đề hoặc bài viết).
// Chặn: thuần phong mỹ tục (sexual, vulgar), chính trị nhạy cảm,
// thù ghét/phân biệt, bạo lực, tự hại, hoạt động phi pháp.
async function moderateContent(text, { kind = 'topic' } = {}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const input = String(text || '').trim();
  if (!input) {
    throw new ModerationError('Empty content', ['empty']);
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are a strict content moderator for an English learning app used by students of all ages, including minors, in Vietnam.

Decide whether the following ${kind} is APPROPRIATE for a writing lesson.

REJECT if it contains or promotes any of:
- sexual / pornographic / vulgar content (violates social decency / thuần phong mỹ tục)
- politically sensitive or inflammatory content, attacks on governments, parties or leaders, content that could incite political conflict
- hate speech, discrimination (race, religion, gender, nationality)
- violence, terrorism, weapons, gore
- self-harm, suicide, drugs, illegal activities
- harassment or content targeting a real private individual

APPROVE normal, neutral, educational, everyday topics.

${kind === 'topic' ? 'Topic' : 'Content'}:
"""
${input}
"""

Return JSON only:
{
  "allowed": true,
  "categories": [],
  "reason": ""
}
- "allowed": boolean
- "categories": array of violated category keywords (empty if allowed), e.g. ["sexual"], ["political"], ["hate"], ["violence"], ["self-harm"], ["illegal"]
- "reason": short explanation in Vietnamese if rejected, empty string if allowed
`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch (err) {
    // Không parse được -> chặn an toàn (fail-closed)
    console.error('Moderation parse error:', raw);
    throw new ModerationError('Không thể kiểm duyệt nội dung, vui lòng thử lại.', ['unknown']);
  }

  if (parsed.allowed !== true) {
    throw new ModerationError(
      parsed.reason || 'Nội dung không phù hợp với quy định của ứng dụng.',
      Array.isArray(parsed.categories) ? parsed.categories : []
    );
  }

  return true;
}

async function generateLesson({ topic, level }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  // Kiểm duyệt chủ đề người học nhập trước khi tạo bài học
  await moderateContent(topic, { kind: 'topic' });

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an English Writing Lesson Generator.

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
7. Return JSON only.

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

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error('Parse error:', text);
    throw new Error(`Failed to generate lesson: ${err.message}`);
  }

  const lesson = {
    id: `lesson_${uuidv4()}`,
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

  await db.collection('writing_lessons').doc(lesson.id).set({
    ...lesson,
    topic,
    created_at: new Date().toISOString()
  });

  return lesson;
}

async function evaluateWriting({ lessonId, content, userId }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const doc = await db.collection('writing_lessons').doc(lessonId).get();
  if (!doc.exists) {
    throw new Error('Lesson not found');
  }

  // Kiểm duyệt nội dung bài viết người học gửi lên trước khi chấm
  await moderateContent(content, { kind: 'content' });

  const lesson = doc.data();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
You are an English Writing Evaluator.

Evaluate the student's writing.

Lesson scenario: ${lesson.scenario}
Writing task: ${lesson.task}
Requirements: ${(lesson.requirements || []).join('; ')}
Target CEFR Level: ${lesson.level}

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

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    console.error('Parse error:', text);
    throw new Error(`Failed to evaluate writing: ${err.message}`);
  }

  const evaluation = {
    grammarScore: Number(parsed.grammarScore) || 0,
    vocabularyScore: Number(parsed.vocabularyScore) || 0,
    taskCompletionScore: Number(parsed.taskCompletionScore) || 0,
    overallScore: Number(parsed.overallScore) || 0,
    estimatedCEFRLevel: parsed.estimatedCEFRLevel || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
    improvedVersion: parsed.improvedVersion || ''
  };

  const submissionId = `sub_${uuidv4()}`;
  await db.collection('writing_submissions').doc(submissionId).set({
    id: submissionId,
    userId: userId || null,
    lessonId,
    topic: lesson.topic || null,
    level: lesson.level || null,
    content,
    ...evaluation,
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  return { id: submissionId, lessonId, userId: userId || null, ...evaluation };
}

async function listLessons({ level, limit = 20 }) {
  let query = db.collection('writing_lessons');

  if (level) {
    query = query.where('level', '==', level);
  }

  query = query.orderBy('created_at', 'desc').limit(Number(limit));

  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data());
}

async function getSubmissionHistory({ userId, limit = 20 }) {
  const snapshot = await db
    .collection('writing_submissions')
    .where('userId', '==', userId)
    .orderBy('created_at', 'desc')
    .limit(Number(limit))
    .get();

  return snapshot.docs.map(doc => doc.data());
}

module.exports = {
  generateLesson,
  evaluateWriting,
  getSubmissionHistory,
  listLessons,
  moderateContent,
  ModerationError
};
