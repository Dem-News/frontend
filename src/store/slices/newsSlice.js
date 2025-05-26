import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  news: {
    currentPage: 1,
    news: [],
    totalPages: 1,
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
  name: "news",
  initialState,
  reducers: {
    fetchNewsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchNewsSuccess: (state, action) => {
      state.loading = false;
      // TODO: Implement proper pagination (e.g., appending news & updating currentPage/totalPages) if required, instead of replacing the entire news object.
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
        (news) => news._id === action.payload._id,
      );
      if (index !== -1) {
        state.news.news[index] = action.payload;
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    verifyNews: (state, action) => {
      const index = state.news.news.findIndex(
        (n) => n._id === action.payload._id,
      );
      if (index !== -1) {
        // Assuming action.payload is the full updated news item from the backend
        state.news.news[index] = {
          ...state.news.news[index],
          ...action.payload,
        };
        // TODO: Backend should ideally return the updated 'isVerified' status directly.
      }
    },
    flagNews: (state, action) => {
      const index = state.news.news.findIndex(
        (n) => n._id === action.payload._id,
      );
      if (index !== -1) {
        // Assuming action.payload is the full updated news item from the backend
        state.news.news[index] = {
          ...state.news.news[index],
          ...action.payload,
        };
        // TODO: Backend should ideally return the updated 'isVerified' status directly.
      }
    },
    addComment: (state, action) => {
      const { newsId, comment } = action.payload;
      const news = state.news.news.find((n) => n._id === newsId);
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
