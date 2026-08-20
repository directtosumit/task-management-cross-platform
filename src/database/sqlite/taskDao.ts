import { Task } from "@/types/task";
import { getDatabase } from "./db";

export async function getLocalTasks(
  userId: string | null | undefined,
): Promise<Task[] | void> {
  if (userId) {
    const db = await getDatabase();
    // Exclude soft-deleted tasks from regular UI queries
    const rows = await db.getAllAsync<any>(
      "SELECT * FROM tasks WHERE userId = ? AND deleted = 0 ORDER BY updatedAt DESC;",
      [userId],
    );
    return rows.map((row) => ({
      ...row,
      completed: row.completed === 1,
      synced: row.synced === 1,
      deleted: row.deleted === 1,
    }));
  }
}

export async function upsertLocalTask(task: Task): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO tasks (id, userId, title, description, completed, dueDate, synced, updatedAt, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      task.id,
      task.userId,
      task.title,
      task.description ?? "",
      task.completed ? 1 : 0,
      task.dueDate,
      task.synced ? 1 : 0,
      task.updatedAt,
      task.deleted ? 1 : 0,
    ],
  );
}

/**
 * Soft deletes a local task by flagging it as deleted and unsynced.
 */
export async function deleteLocalTask(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE tasks SET deleted = 1, synced = 0, updatedAt = ? WHERE id = ?;",
    [Date.now(), id],
  );
}

/**
 * Permanently removes a task from SQLite after it has been deleted from the cloud.
 */
export async function permanentlyDeleteLocalTask(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM tasks WHERE id = ?;", [id]);
}

export async function getUnsyncedTasks(userId: string): Promise<Task[]> {
  const db = await getDatabase();
  // Retrieves both newly created/updated tasks AND soft-deleted tasks pending sync
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM tasks WHERE userId = ? AND synced = 0;",
    [userId],
  );
  return rows.map((row) => ({
    ...row,
    completed: row.completed === 1,
    synced: false,
    deleted: row.deleted === 1,
  }));
}

/**
 * Retrieves a single task by its unique ID from the local SQLite database.
 */
export async function getLocalTaskById(id: string): Promise<Task | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<any>(
      `SELECT * FROM tasks WHERE id = ? AND deleted = 0;`,
      [id],
    );

    if (!result) {
      return null;
    }

    const task: Task = {
      id: result.id,
      userId: result.userId,
      title: result.title,
      description: result.description ?? "",
      completed: Boolean(result.completed),
      dueDate: result.dueDate,
      synced: Boolean(result.synced),
      updatedAt: result.updatedAt,
      deleted: Boolean(result.deleted),
    };

    return task;
  } catch (error) {
    console.error(`Error fetching task by ID (${id}):`, error);
    return null;
  }
}
