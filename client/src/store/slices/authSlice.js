import { createSlice } from '@reduxjs/toolkit';

// If BOTH token and user are already in localStorage, auth is initialized immediately.
// If only a token exists (no stored user), we need to call /auth/me first — mark as not yet initialized.
const storedToken = localStorage.getItem('token') || null;
const storedUser  = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

const initialState = {
  user:            storedUser,
  token:           storedToken,
  // true once we know for certain whether the session is valid (either both loaded
  // from localStorage, or getMe() has completed/failed, or there is no token at all).
  authInitialized: !storedToken || !!storedUser,
  isLoading:       false,
  error:           null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setUser: (state, action) => {
      state.user            = action.payload.user;
      state.token           = action.payload.token;
      state.authInitialized = true;
      localStorage.setItem('user',  JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
      state.error = null;
    },
    setAuthInitialized: (state) => {
      state.authInitialized = true;
    },
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.authInitialized = true;   // after logout we know the state for certain
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      state.error = null;
    },
  },
});

export const { setLoading, setError, setUser, setAuthInitialized, logout } = authSlice.actions;
export default authSlice.reducer;
