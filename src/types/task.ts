export interface Task {
    id: string;             // UUID generated locally or Firestore document ID
    userId: string;         // Firebase Auth UID
    title: string;
    description: string;
    completed: boolean;
    dueDate: string;        // ISO string for local/cloud compatibility
    synced: boolean;        // true for synced with Firestore, false for pending offline changes
    updatedAt: number;      // Timestamp for conflict resolution
    deleted?: boolean;      // True if soft-deleted locally, pending cloud removal
}