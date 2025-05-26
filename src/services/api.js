import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../constants/api";

// TODO: Make API_URL configurable via environment variables (e.g., using react-native-dotenv)
const API_URL = API_BASE_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    // TODO: Implement token refresh logic here if the API supports refresh tokens.
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const structuredError = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    };
    console.error("API Error:", structuredError);
    return Promise.reject(structuredError);
  },
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/users/login", credentials),
  register: (userData) => api.post("/users/register", userData),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.patch("/users/profile", data),
  updateLocation: (location) => api.patch("/users/location", location),
};

// News API
export const newsAPI = {
  createNews: (newsData) => api.post("/news", newsData),
  getNewsByLocation: (params) => api.get("/news/location", { params }),
  verifyNews: (newsId, data) => api.post(`/news/${newsId}/verify`, data),
  flagNews: (newsId, reason) => api.post(`/news/${newsId}/flag`, { reason }),
  searchNews: (params) => api.get("/news/search", { params }),
  getComments: (newsId) => api.get(`/news/${newsId}/comments`),
  addComment: (newsId, content) =>
    api.post(`/news/${newsId}/comments`, { content }),
};

export default api;
