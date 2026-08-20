import {configureStore} from '@reduxjs/toolkit';
import taskReducer from './taskSlice';
import {notificationMiddleware} from "@/store/notificationMiddleware";

export const store = configureStore({
    reducer: {
        tasks: taskReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(notificationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;