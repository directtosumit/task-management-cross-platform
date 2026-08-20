import { auth } from "@/config/firebase"; // import your RootState type
import { channelId } from "@/constants/constants";
import { Task } from "@/types/task";
import { Middleware } from '@reduxjs/toolkit';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from "expo-notifications/src";
import { Platform } from "react-native";
import { RootState } from './store';
import { permanentDeleteTask, saveTask, softDeleteTask } from './taskSlice';

export const notificationMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    // Check if the action is one of the task mutation actions that finished successfully
    if (
        saveTask.fulfilled.match(action) ||
        softDeleteTask.fulfilled.match(action) ||
        permanentDeleteTask.fulfilled.match(action)
    ) {
        console.log('Task changed! Refreshing notifications...');

        // If a refresh is currently running, mark that we have a pending change
        if (isRefreshing) {
            hasPendingChanges = true;
            return result;
        }

        // Helper function to handle the execution loop
        const executeRefresh = async () => {
            isRefreshing = true;
            hasPendingChanges = false; // Reset the pending flag as we start a fresh run

            try {
                const state = store.getState() as RootState;
                const allTasks = state.tasks.tasks;

                // Run the asynchronous notification update using the absolute latest state
                await refreshAllTaskNotifications(allTasks);
            } catch (error) {
                console.error("Failed to refresh notifications:", error);
            } finally {
                isRefreshing = false;

                // If another task change came in *while* we were running, 
                // run it again immediately with the newest state.
                if (hasPendingChanges) {
                    console.log('Pending changes detected, re-running notification refresh...');
                    executeRefresh();
                }
            }
        };

        // Kick off the initial execution
        executeRefresh();
    }

    return result;
};

let isRefreshing = false;
let hasPendingChanges = false;

/**
 * Clears all pending notifications and reschedules reminders for all active (uncompleted) future tasks.
 */
async function refreshAllTaskNotifications(tasks: Task[]) {
    try {

        const userId = auth.currentUser?.uid;
        if (userId) {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== "granted") {
                const { status: newStatus } =
                    await Notifications.requestPermissionsAsync();
                if (newStatus !== "granted") return;
            }
            // Mandatory configuration rule for Android platforms
            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync(channelId, {
                    name: "Notifications about scheduled tasks",
                    importance: Notifications.AndroidImportance.MAX,
                });
            }
            // 1. Cancel all previously scheduled notifications to clear stale alerts
            await Notifications.cancelAllScheduledNotificationsAsync();

            if (tasks?.length) {
                const today = new Date();
                const now = today.getTime();
                const currentDate = today.toDateString(); // Format to compare calendar days (e.g., "Wed Aug 12 2026")


                for (const task of tasks) {
                    if (!task.completed && task.dueDate) {
                        const dueDateObj = new Date(task.dueDate);
                        const triggerTime = dueDateObj.getTime();
                        const taskDateString = dueDateObj.toDateString();

                        const isToday = taskDateString === currentDate;
                        const isFuture = triggerTime > now;

                        // Condition: Future deadline OR (Today's date even if time has passed)
                        if (isFuture || (isToday && !await isTaskNotificationPresented(task.id))) {
                            // Check if a notification for this task is already queued up
                            const triggerInput = isFuture
                                ? {
                                    channelId,
                                    type: SchedulableTriggerInputTypes.DATE,
                                    date: dueDateObj,
                                }
                                : {channelId};

                            await Notifications.scheduleNotificationAsync({
                                content: {
                                    title: isFuture
                                        ? "Task Reminder ⏰"
                                        : "Task Due Today / Overdue ⚠️",
                                    body: `Deadline for: "${task.title}"`,
                                    data: { taskId: task.id },
                                },
                                trigger: triggerInput,
                            });
                        }
                    }
                }
                console.log(
                    "Task notifications successfully refreshed and checked for today.",
                );
            }
        }
    } catch (error) {
        console.error("Failed to refresh task notifications:", error);
    }

    if(__DEV__){
        await logAllScheduledNotifications();
    }
}

/**
 * Checks if a notification for a specific task is currently displayed in the notification tray.
 */
async function isTaskNotificationPresented(taskId: string): Promise<boolean> {
    try {
        const presentedNotifications = await Notifications.getPresentedNotificationsAsync();

        if(presentedNotifications?.length) {

            // Iterate through active notifications to find a match for the task ID
            for (const notification of presentedNotifications) {
                // console.log(notification.request.content.data)
                const data = notification.request.content.data as { taskId?: string };
                if (data && data.taskId === taskId) {
                    return true; // Notification is already active in the tray
                }
            }
        }

        return false;
    } catch (error) {
        console.error('Error checking presented notifications:', error);
        return false;
    }
}

/**
 * Fetches and logs all currently scheduled local notifications,
 * including their trigger times, dates, and contents.
 */
async function logAllScheduledNotifications(): Promise<void> {
    try {
        const scheduledNotifications =
            await Notifications.getAllScheduledNotificationsAsync();

        console.log(
            `--- Total Scheduled Notifications: ${scheduledNotifications.length} ---`,
        );

        if (scheduledNotifications.length === 0) {
            console.log("No notifications are currently scheduled.");
            return;
        }

        scheduledNotifications.forEach((notification, index) => {
            const { identifier, content, trigger } = notification;

            let scheduledDate = "Unknown / Non-date trigger";

           // console.log({ trigger });

            if (trigger) {
                // Check and extract date/time based on the trigger type
                if (trigger.type === SchedulableTriggerInputTypes.DATE) {
                    scheduledDate = new Date(trigger.value).toLocaleString();
                } else scheduledDate = JSON.stringify(trigger);
            }

            console.log(`\n[Notification #${index + 1}]`);
            console.log(`- ID: ${identifier}`);
            console.log(`- Title: ${content.title || "N/A"}`);
            console.log(`- Body: ${content.body || "N/A"}`);
            console.log(`- Data Payload:`, JSON.stringify(content.data));
            console.log(`- Scheduled For: ${scheduledDate}`);
            console.log(`- Trigger Type: ${trigger?.type || "Unknown"}`);
        });

        console.log("\n--------------------------------------------------");
    } catch (error) {
        console.error("Error fetching scheduled notifications:", error);
    }
}