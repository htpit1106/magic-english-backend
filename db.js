const Database = require('better-sqlite3');
const db = new Database('data.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    sourceUrl TEXT ,
    title TEXT,
    content TEXT,
    topic TEXT,
    source TEXT,
    image_url TEXT,
    published_at TEXT
  )
`).run();
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    topics TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    title TEXT,
    text TEXT,
    topic TEXT,
    level TEXT,
    reading_time INTEGER,
    source_url TEXT,
    image_url TEXT,
    published_at TEXT
  )
`).run();

// words table for vocabulary words


db.prepare(`
  CREATE TABLE IF NOT EXISTS vocabulary (
    word TEXT PRIMARY KEY,
    meaning TEXT,
    phonetic TEXT,
    example TEXT,
    audio TEXT,
    created_at TEXT
  )
`).run();


module.exports = db;
