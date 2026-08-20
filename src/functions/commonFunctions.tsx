import {auth} from "@/config/firebase";
import * as Notifications from "expo-notifications";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowList: true,
    shouldShowBanner: true,
  }),
});

/**
 *
 * Formats a UTC date string into IST (Indian Standard Time) as "31 July 2026".
 *
 * @param {string} utcDateString - The ISO date string (e.g., "2026-07-30T18:30:00.000Z")
 * @param {boolean} [dateOnly=true] - If true, returns only the formatted date.
 * @returns {string} The formatted IST date string
 */
const formatDateTimeToIST = (
  utcDateString: string,
  dateOnly: boolean = true,
): string => {
  const dateObj = new Date(utcDateString);

  if (dateOnly) {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "long",
    timeStyle: "medium",
  }).format(dateObj);
};

const formatDateToString = (date: Date | undefined): string => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTimeToString = (
  time: { hours: number; minutes: number } | null,
): string => {
  if (!time) return "";
  const hours = String(time.hours).padStart(2, "0");
  const minutes = String(time.minutes).padStart(2, "0");
  return `${hours}:${minutes}:00`;
};

/**
 * Converts a time string (e.g., "14:30:00" or "14:30") into an hours and minutes object.
 *
 * @param {string} timeString - The time string in "HH:mm:ss" or "HH:mm" format.
 * @returns {{ hours: number; minutes: number } | null} The parsed hours and minutes object, or null if invalid.
 */
const parseTimeString = (
  timeString: string | null | undefined,
): { hours: number; minutes: number } | null => {
  if (!timeString || typeof timeString !== "string") return null;

  const parts = timeString.split(":");
  if (parts.length < 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  return { hours, minutes };
};

function enlargeArray(arr, targetLength) {
  return Array.from(
    { length: targetLength },
    (_, index) => arr[index % arr.length],
  );
}

const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (user) {
    const uid = user.uid;
    console.log("Current User ID:", uid);
    return uid;
  } else {
    console.log("No user is currently logged in.");
    return null;
  }
};




export {
  formatDateTimeToIST,
  formatDateToString,
  formatTimeToString,
  parseTimeString,
  enlargeArray,
  getCurrentUserId,
};
