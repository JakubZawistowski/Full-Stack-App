import { configureStore } from '@reduxjs/toolkit';
import authReducer from './redux/auth';
import friendsReducer from "./redux/friendsReducer";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        friends: friendsReducer,
    },
});
