import * as SQLite from 'expo-sqlite';
import type { LanguageCode } from '@/constants';

export interface ReadingProfile {
  id: number;
  readingLevel: number;
  targetLanguage: LanguageCode;
  fontSize: number;
  dyslexicFont: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionLog {
  id: number;
  mode: string;
  inputText: string;
  outputText: string;
  wordCount: number;
  createdAt: string;
}

export interface WordLookup {
  id: number;
  word: string;
  definition: string;
  lookedUpAt: string;
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('brain.db');
  await migrate(_db);
  return _db;
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS reading_profile (
      id INTEGER PRIMARY KEY NOT NULL,
      reading_level INTEGER NOT NULL DEFAULT 3,
      target_language TEXT NOT NULL DEFAULT 'en',
      font_size INTEGER NOT NULL DEFAULT 18,
      dyslexic_font INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      input_text TEXT NOT NULL,
      output_text TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS word_lookups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      definition TEXT NOT NULL,
      looked_up_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_session_log_created ON session_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_word_lookups_word ON word_lookups(word);
  `);

  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reading_profile'
  );
  if (existing?.count === 0) {
    await db.runAsync(
      'INSERT INTO reading_profile (id, reading_level, target_language, font_size, dyslexic_font) VALUES (1, 3, ?, 18, 0)',
      ['en']
    );
  }
}

export async function getReadingProfile(): Promise<ReadingProfile> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: number;
    reading_level: number;
    target_language: string;
    font_size: number;
    dyslexic_font: number;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM reading_profile WHERE id = 1');

  if (!row) throw new Error('Reading profile not found');
  return {
    id: row.id,
    readingLevel: row.reading_level,
    targetLanguage: row.target_language as LanguageCode,
    fontSize: row.font_size,
    dyslexicFont: row.dyslexic_font === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateReadingProfile(
  updates: Partial<Omit<ReadingProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.readingLevel !== undefined) {
    fields.push('reading_level = ?');
    values.push(updates.readingLevel);
  }
  if (updates.targetLanguage !== undefined) {
    fields.push('target_language = ?');
    values.push(updates.targetLanguage);
  }
  if (updates.fontSize !== undefined) {
    fields.push('font_size = ?');
    values.push(updates.fontSize);
  }
  if (updates.dyslexicFont !== undefined) {
    fields.push('dyslexic_font = ?');
    values.push(updates.dyslexicFont ? 1 : 0);
  }
  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  values.push(1);

  await db.runAsync(
    `UPDATE reading_profile SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function saveSession(session: Omit<SessionLog, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDb();

  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM session_log'
  );
  if ((count?.count ?? 0) >= 10) {
    await db.runAsync(
      'DELETE FROM session_log WHERE id = (SELECT id FROM session_log ORDER BY created_at ASC LIMIT 1)'
    );
  }

  await db.runAsync(
    'INSERT INTO session_log (mode, input_text, output_text, word_count) VALUES (?, ?, ?, ?)',
    [session.mode, session.inputText, session.outputText, session.wordCount]
  );
}

export async function getRecentSessions(limit = 10): Promise<SessionLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    mode: string;
    input_text: string;
    output_text: string;
    word_count: number;
    created_at: string;
  }>('SELECT * FROM session_log ORDER BY created_at DESC LIMIT ?', [limit]);

  return rows.map((r) => ({
    id: r.id,
    mode: r.mode,
    inputText: r.input_text,
    outputText: r.output_text,
    wordCount: r.word_count,
    createdAt: r.created_at,
  }));
}

export async function saveWordLookup(word: string, definition: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO word_lookups (word, definition) VALUES (?, ?)',
    [word.toLowerCase().trim(), definition]
  );
}

export async function getCachedOutput(mode: string, inputText: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ output_text: string }>(
    'SELECT output_text FROM session_log WHERE mode = ? AND input_text = ? ORDER BY created_at DESC LIMIT 1',
    [mode, inputText]
  );
  return row?.output_text ?? null;
}

export async function getWordLookups(limit = 50): Promise<WordLookup[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    word: string;
    definition: string;
    looked_up_at: string;
  }>('SELECT * FROM word_lookups ORDER BY looked_up_at DESC LIMIT ?', [limit]);

  return rows.map((r) => ({
    id: r.id,
    word: r.word,
    definition: r.definition,
    lookedUpAt: r.looked_up_at,
  }));
}

export async function getProfileStats(): Promise<{
  totalSessions: number;
  totalWords: number;
  uniqueWords: number;
  sessionsByMode: Record<string, number>;
}> {
  const db = await getDb();

  const totals = await db.getFirstAsync<{ total_sessions: number; total_words: number }>(
    'SELECT COUNT(*) as total_sessions, COALESCE(SUM(word_count), 0) as total_words FROM session_log'
  );

  const uniqueWords = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(DISTINCT word) as count FROM word_lookups'
  );

  const modeRows = await db.getAllAsync<{ mode: string; count: number }>(
    'SELECT mode, COUNT(*) as count FROM session_log GROUP BY mode'
  );

  const sessionsByMode: Record<string, number> = {};
  for (const row of modeRows) {
    sessionsByMode[row.mode] = row.count;
  }

  return {
    totalSessions: totals?.total_sessions ?? 0,
    totalWords: totals?.total_words ?? 0,
    uniqueWords: uniqueWords?.count ?? 0,
    sessionsByMode,
  };
}
