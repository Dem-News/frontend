import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: null,
  loading: false,
  error: null,
  permissionStatus: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocationStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setLocationSuccess: (state, action) => {
      state.loading = false;
      state.currentLocation = action.payload;
    },
    setLocationFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setPermissionStatus: (state, action) => {
      state.permissionStatus = action.payload;
    },
  },
});

export const {
  setLocationStart,
  setLocationSuccess,
  setLocationFailure,
  setPermissionStatus,
} = locationSlice.actions;

export default locationSlice.reducer; 