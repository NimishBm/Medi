import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import queueReducer from './slices/queueSlice';

export default configureStore({
  reducer: {
    auth: authReducer,
    queue: queueReducer,
  },
});
