import * as SQLite from "expo-sqlite";

// Singleton instance promise or direct handle
let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    // Open the database synchronously once and cache the reference
    dbInstance = SQLite.openDatabaseSync("tasks.db");
  }
  return dbInstance;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      dueDate TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );
  `);
}
