import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  news: {
    currentPage: 1,
    news: [],
    totalPages: 1
  },
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
      state.news.news.unshift(action.payload);
    },
    updateNews: (state, action) => {
      const index = state.news.news.findIndex(
        news => news._id === action.payload._id
      );
      if (index !== -1) {
        state.news.news[index] = action.payload;
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    verifyNews: (state, action) => {
      const news = state.news.news.find(n => n._id === action.payload._id);
      if (news) {
        news.verificationCount += 1;
        news.isVerified = news.verificationCount >= 10 && news.flagCount < 3;
      }
    },
    flagNews: (state, action) => {
      const news = state.news.news.find(n => n._id === action.payload._id);
      if (news) {
        news.flagCount += 1;
        news.isVerified = news.verificationCount >= 10 && news.flagCount < 3;
      }
    },
    addComment: (state, action) => {
      const { newsId, comment } = action.payload;
      const news = state.news.news.find(n => n._id === newsId);
      if (news) {
        if (!news.comments) {
          news.comments = [];
        }
        news.comments.push(comment);
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
  addComment,
} = newsSlice.actions;

export default newsSlice.reducer; 