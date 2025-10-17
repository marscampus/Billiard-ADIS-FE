import { configureStore } from '@reduxjs/toolkit';
import userReducer from './feature/slice';

export default configureStore({
  reducer: {
    counter: userReducer,
  },
})