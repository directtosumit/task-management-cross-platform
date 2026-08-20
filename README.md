
# Task Management App – Take-Home Assignment


---




### Key Features of the Mobile Application
* **Secure Authentication**: User sign-up and login functionality powered by Firebase Authentication with persistent session management.
* **Comprehensive Task Management**: Create, view, update, delete, and mark tasks as complete or incomplete.
* **Robust Offline Support**: Built-in local SQLite storage enabling full app functionality without an internet connection, with automatic syncing to Firestore once connectivity returns.
* **Smart Local Push Notifications**: Automated local reminders for tasks that work offline and schedule dynamically for newly created tasks.
* **Dynamic Light/Dark Theme Support**: Seamless UI adaptation across light and dark color schemes built directly into the component system.
* **Cross-Platform Design**: Built for multi-environment configurations (`dev`, `staging`, `production`).
* **Optimized Performance**: Efficient list virtualization via React Native FlatList and modular folder structures.

---

## 📺 Video Walkthrough
A complete walkthrough and screen recording of the application features can be viewed here:
> [🔗 Watch Video Walkthrough](https://drive.google.com/file/d/14zikY2fIzhzpOv3DfVvo9CGMP34rT5Ds/view)

---

### 1. Architecture Choice
The application is structured following a **Modular, Clean Architecture** pattern designed to separate concerns between presentation, business logic, local persistence, and cloud synchronization:
* **Presentation Layer (`src/app/` & `src/auth/`)**: Built using **Expo Router** for file-based routing and **React Navigation** primitives. UI styling and components utilize **React Native Paper** to ensure clean multi-environment theming (Dark/Light mode).
* **State Management Layer (`src/store/`)**: Powered by **Redux Toolkit** (Async Thunks and Slices) to handle app-wide reactive state for authentication, user session persistence, and tasks.
* **Persistence & Sync Layer (`src/database/` & `src/store/`)**: 
  * **Local Database (`expo-sqlite`)**: All tasks are instantaneously read from and written to a local SQLite database, ensuring lightning-fast offline support and reliability.
  * **Cloud Sync (`src/database/firestore/taskSync.ts`)**: Background sync mechanisms reconcile local offline changes with **Firestore** when network connectivity is restored.
* **Multi-Environment Setup (`app.config.js` & `eas.json`)**: Employs dynamic configuration mapping via `EXPO_PUBLIC_APP_VARIANT` to cleanly separate `dev`, `staging`, and `production` builds (distinct app names and bundle identifiers).

---

### 2. Libraries Used
* **Framework & Routing**: `expo` (~57.0.12), `expo-router` (~57.0.12)
* **UI & Animation**: `react-native-paper` (^5.15.3), `react-native-reanimated` (4.5.1), `@expo/vector-icons`
* **State Management**: `@reduxjs/toolkit` (^2.12.0), `react-redux` (^9.3.0)
* **Local Storage & Database**: `expo-sqlite` (~57.0.1), `@react-native-async-storage/async-storage` (2.2.0)
* **Backend & Cloud**: `firebase` (^12.17.1) (Authentication & Firestore)
* **Notifications & Network**: `expo-notifications` (~57.0.10), `@react-native-community/netinfo` (12.0.1)

---

### 3. How to Run the App in Each Environment

#### Prerequisites
* Node.js installed.
* Expo CLI / EAS CLI configured.
* Android Studio / Xcode configured for emulators (or physical device with Expo Go / Dev Client).

#### Environment Setup & Configuration

To protect sensitive credentials, actual Firebase configuration files and `google-services.json` are excluded from this public repository. Because this implementation relies on robust client-side local push notifications, **a `google-services.json` file is not required** to run and test the app locally.

To run the app, create a `.env` file in the root directory using the template provided in `.env.example`:


##### Choose your environment variant (dev, staging, or production)
```env
EXPO_PUBLIC_APP_VARIANT=production

```

##### Firebase Configuration Variables

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id_here
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```


#### Commands

1. **Install Dependencies:**
   ```bash
   npm install



2. **Run in Development Mode:**
* *Using `.env` file:* Set `EXPO_PUBLIC_APP_VARIANT=dev` in your `.env` file, then run:
```bash
npx expo prebuild --platform android --clean; npx expo run:android

```


3. **Run Staging Build:**
* *Using `.env` file:* Set `EXPO_PUBLIC_APP_VARIANT=staging` in your `.env` file, then run:
```bash
npx expo prebuild --platform android --clean; npx expo run:android 

```



4. **Run Production Build:**
* *Using `.env` file:* Set `EXPO_PUBLIC_APP_VARIANT=production` in your `.env` file, then run:
```bash
npx expo prebuild --platform android --clean; npx expo run:android --variant release

```


---

### 4. Known Limitations

* **Server-Side Push Notifications (FCM):** Implemented via robust client-side local push notifications for task reminders. Local notifications are better for this use case because they work even when the phone is offline, and any new task created while offline will also fire a notification at the scheduled time. For server-side push notifications, two cloud functions would be required: one to schedule a Google Cloud Tasks queue and another to send the actual push notification when the time arrives. However, these cloud functions require an active Billing Account, and I chose not to create a billing account for assignment tasks.



