import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.10.101:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      }
    });
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  updateLocation: (location) => api.patch('/users/location', location),
};

// News API
export const newsAPI = {
  createNews: (newsData) => api.post('/news', newsData),
  getNewsByLocation: (params) => {
    // For local view, use location endpoint
    if (params.scope === 'local') {
      return api.get('/news', { 
        params: {
          scope: 'local',
          location: params.location,
          tag: params.category,
          page: params.page || 1,
          limit: params.limit || 10
        }
      });
    }
    // For explore view, use regular news endpoint
    return api.get('/news', {
      params: {
        scope: 'explore',
        tag: params.category,
        page: params.page || 1,
        limit: params.limit || 10
      }
    });
  },
  verifyNews: (newsId, data) => api.post(`/news/${newsId}/verify`, data),
  flagNews: (newsId, reason) => api.post(`/news/${newsId}/flag`, { reason }),
  searchNews: (params) => api.get('/news/search', { params }),
  getComments: (newsId) => api.get(`/news/${newsId}/comments`),
  addComment: (newsId, content) => api.post(`/news/${newsId}/comments`, { content }),
  likeNews: (newsId) => api.post(`/news/${newsId}/like`),
};

export default api; 