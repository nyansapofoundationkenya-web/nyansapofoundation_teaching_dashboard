// redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  loading: true,
  error: null,
  isApiAuth: false,    
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.isApiAuth = false;   
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setIsApiAuth: (state, action) => { 
      state.isApiAuth = action.payload;
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoading,
  setError,
  updateUserProfile,
  setIsApiAuth,            
} = authSlice.actions;

export default authSlice.reducer;