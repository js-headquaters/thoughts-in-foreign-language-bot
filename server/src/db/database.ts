import sqlite3 from "sqlite3";
import { open } from "sqlite";

// Initialize database connection
export async function initializeDatabase() {
  const db = await open({
    filename: "./translations.db",
    driver: sqlite3.Database,
  });

  // Create translations table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_text TEXT NOT NULL,
      translated_text TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY,
      translation_language TEXT DEFAULT 'espanol',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

// Helper functions for database operations
export async function saveTranslation(
  db: any,
  userId: number,
  originalText: string,
  translatedText: string
) {
  return db.run(
    "INSERT INTO translations (user_id, original_text, translated_text) VALUES (?, ?, ?)",
    [userId, originalText, translatedText]
  );
}

export async function getUserSettings(db: any, userId: number) {
  return db.get("SELECT * FROM users WHERE user_id = ?", [userId]);
}

export async function createOrUpdateUser(
  db: any,
  userId: number,
  translationLanguage: string = "espanol"
) {
  return db.run(
    "INSERT OR REPLACE INTO users (user_id, translation_language) VALUES (?, ?)",
    [userId, translationLanguage]
  );
}
