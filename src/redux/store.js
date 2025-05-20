// store/index.js or store.js
import { configureStore } from '@reduxjs/toolkit';

// A dummy reducer that just returns the initial state
const dummyReducer = (state = {}, action) => state;

export const store = configureStore({
  reducer: {
    dummy: dummyReducer, // 🔧 Placeholder reducer
  },
});
