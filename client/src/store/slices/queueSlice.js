import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  queue: [],
  stats: {
    total: 0,
    waiting: 0,
    called: 0,
    consulting: 0,
    completed: 0,
    skipped: 0,
  },
  currentPatient: null,
  isLoading: false,
  error: null,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueue: (state, action) => {
      state.queue = action.payload.queue;
      state.stats = action.payload.stats;
      state.error = null;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateQueue: (state, action) => {
      state.queue = action.payload.queue;
      state.stats = action.payload.stats;
    },
  },
});

export const { setQueue, setCurrentPatient, setLoading, setError, updateQueue } = queueSlice.actions;
export default queueSlice.reducer;
