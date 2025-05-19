import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  news: [],
  currentNews: null,
  loading: false,
  error: null,
  filters: {
    category: null,
    verified: false,
    radius: 5,
  },
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    fetchNewsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNewsSuccess: (state, action) => {
      state.loading = false;
      state.news = action.payload;
    },
    fetchNewsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setCurrentNews: (state, action) => {
      state.currentNews = action.payload;
    },
    addNews: (state, action) => {
      if (!Array.isArray(state.news)) {
        state.news = [];
      }
      state.news.unshift(action.payload);
    },
    updateNews: (state, action) => {
      const index = state.news.findIndex(
        news => news._id === action.payload._id
      );
      if (index !== -1) {
        state.news[index] = action.payload;
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    verifyNews: (state, action) => {
      const news = state.news.find(n => n._id === action.payload._id);
      if (news) {
        news.verificationCount += 1;
        news.isVerified = news.verificationCount >= 10 && news.flagCount < 3;
      }
    },
    flagNews: (state, action) => {
      const news = state.news.find(n => n._id === action.payload._id);
      if (news) {
        news.flagCount += 1;
        news.isVerified = news.verificationCount >= 10 && news.flagCount < 3;
      }
    },
  },
});

export const {
  fetchNewsStart,
  fetchNewsSuccess,
  fetchNewsFailure,
  setCurrentNews,
  addNews,
  updateNews,
  setFilters,
  verifyNews,
  flagNews,
} = newsSlice.actions;

export default newsSlice.reducer; 