import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { Task } from "@/types/task";
import { store } from "@/store/store";
import {
  fetchUnsyncedTasks,
  permanentDeleteTask,
  saveTask,
} from "@/store/taskSlice";
import { db } from "@/config/firebase";

/**
 * Pushes local offline changes (including soft deletions) up to Firestore when online
 */
export async function syncLocalChangesToCloud(userId: string): Promise<void> {
  try {
    // Fetch unsynced tasks via Redux thunk
    await store.dispatch(fetchUnsyncedTasks(userId)).unwrap();
    const unsyncedTasks = store.getState().tasks.unsyncedTasks;

    for (const task of unsyncedTasks) {
      const taskRef = doc(db, "tasks", task.id);

      if (task.deleted) {
        // 1. Delete document from Firestore
        await deleteDoc(taskRef);
        // 2. Permanently remove record from local database and update Redux memory via thunk
        await store.dispatch(permanentDeleteTask(task.id)).unwrap();
      } else {
        // Normal create/update sync
        await setDoc(
          taskRef,
          {
            userId: task.userId,
            title: task.title,
            description: task.description,
            completed: task.completed,
            dueDate: task.dueDate,
            updatedAt: task.updatedAt,
          },
          { merge: true },
        );

        // Mark as synced locally and update Redux memory via thunk
        await store.dispatch(saveTask({ ...task, synced: true })).unwrap();
      }
    }
  } catch (error) {
    console.error("Error syncing local changes to cloud:", error);
  }
}

/**
 * Listens for real-time changes from Firestore and mirrors them to SQLite via Redux
 */
export function subscribeToCloudTasks(
  userId: string,
  onSyncComplete?: () => void,
) {
  const q = query(collection(db, "tasks"), where("userId", "==", userId));

  const unsubscribe = onSnapshot(
    q,
    async (querySnapshot) => {
      try {
        for (const change of querySnapshot.docChanges()) {
          const data = change.doc.data();
          const task: Task = {
            id: change.doc.id,
            userId: data.userId,
            title: data.title,
            description: data.description ?? "",
            completed: data.completed,
            dueDate: data.dueDate,
            synced: true,
            updatedAt: data.updatedAt || Date.now(),
            deleted: false,
          };

          if (change.type === "added" || change.type === "modified") {
            await store.dispatch(saveTask(task)).unwrap();
          }
          if (change.type === "removed") {
            // If deleted from cloud (e.g. from another device), permanently wipe it locally & from state
            await store.dispatch(permanentDeleteTask(task.id)).unwrap();
          }
        }
        if (onSyncComplete) onSyncComplete();
      } catch (error) {
        console.error("Error processing real-time cloud snapshot:", error);
      }
    },
    (error) => {
      console.error("Firestore snapshot listener error:", error);
    },
  );

  return unsubscribe;
}

export async function fetchCloudTasksToLocal(userId: string): Promise<void> {
  try {
    const q = query(collection(db, "tasks"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    for (const documentSnapshot of querySnapshot.docs) {
      const data = documentSnapshot.data();
      const cloudTask: Task = {
        id: documentSnapshot.id,
        userId: data.userId,
        title: data.title,
        description: data.description ?? "",
        completed: data.completed,
        dueDate: data.dueDate,
        synced: true,
        updatedAt: data.updatedAt || Date.now(),
        deleted: false,
      };
      await store.dispatch(saveTask(cloudTask)).unwrap();
    }
  } catch (error) {
    console.error("Error fetching tasks from cloud:", error);
  }
}
