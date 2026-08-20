import {
  deleteLocalTask,
  getLocalTaskById,
  getLocalTasks,
  getUnsyncedTasks,
  permanentlyDeleteLocalTask,
  upsertLocalTask,
} from "@/database/sqlite/taskDao";
import { Task } from "@/types/task";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TaskState {
  tasks: Task[];
  unsyncedTasks: Task[];
  currentTask: Task | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  unsyncedTasks: [],
  currentTask: null,
  status: "idle",
  error: null,
};

// 1. Fetch all active tasks for a user
export const fetchUserTasks = createAsyncThunk(
  "tasks/fetchUserTasks",
  async (userId: string) => {
    const tasks = await getLocalTasks(userId);
    return tasks ?? [];
  },
);

// 2. Insert or update a task locally
export const saveTask = createAsyncThunk(
  "tasks/saveTask",
  async (task: Task) => {
    await upsertLocalTask(task);
    return task;
  },
);

// 3. Soft delete a task locally
export const softDeleteTask = createAsyncThunk(
  "tasks/softDeleteTask",
  async (taskId: string) => {
    await deleteLocalTask(taskId);
    return taskId;
  },
);

// 4. Permanently delete a task from SQLite
export const permanentDeleteTask = createAsyncThunk(
  "tasks/permanentDeleteTask",
  async (taskId: string) => {
    await permanentlyDeleteLocalTask(taskId);
    return taskId;
  },
);

// 5. Fetch all unsynced tasks (for cloud synchronization)
export const fetchUnsyncedTasks = createAsyncThunk(
  "tasks/fetchUnsyncedTasks",
  async (userId: string) => {
    const unsynced = await getUnsyncedTasks(userId);
    return unsynced;
  },
);

// 6. Fetch a single task by ID
export const fetchTaskById = createAsyncThunk(
  "tasks/fetchTaskById",
  async (taskId: string) => {
    const task = await getLocalTaskById(taskId);
    return task;
  },
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearCurrentTask(state) {
      state.currentTask = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserTasks
      .addCase(fetchUserTasks.pending, (state) => {
        state.status = "loading";
      })
      .addCase(
        fetchUserTasks.fulfilled,
        (state, action: PayloadAction<Task[]>) => {
          state.status = "succeeded";
          state.tasks = action.payload;
        },
      )
      .addCase(fetchUserTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error?.message ?? "Failed to fetch tasks";
      })

      // saveTask (Upsert)
      .addCase(saveTask.fulfilled, (state, action: PayloadAction<Task>) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index >= 0) {
          state.tasks[index] = action.payload;
        } else {
          state.tasks.unshift(action.payload);
        }
      })

      // softDeleteTask
      .addCase(
        softDeleteTask.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        },
      )

      // permanentDeleteTask
      .addCase(
        permanentDeleteTask.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.tasks = state.tasks.filter((t) => t.id !== action.payload);
          state.unsyncedTasks = state.unsyncedTasks.filter(
            (t) => t.id !== action.payload,
          );
        },
      )

      // fetchUnsyncedTasks
      .addCase(
        fetchUnsyncedTasks.fulfilled,
        (state, action: PayloadAction<Task[]>) => {
          state.unsyncedTasks = action.payload;
        },
      )

      // fetchTaskById
      .addCase(
        fetchTaskById.fulfilled,
        (state, action: PayloadAction<Task | null>) => {
          state.currentTask = action.payload;
        },
      );
  },
});

export const { clearCurrentTask } = taskSlice.actions;
export default taskSlice.reducer;
