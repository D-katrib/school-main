import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API temel URL'si - backend'in çalıştığı adresi kullanın
const API_URL = 'http://10.192.32.29:5000/api';

// Axios instance oluşturma
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - her istekten önce token'ı ekler
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - hata durumlarını yönetir
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz veya süresi dolmuş
      await AsyncStorage.removeItem('authToken');
      // Kullanıcıyı login sayfasına yönlendir
      // Bu kısım navigation hook'u ile yapılacak
    }
    return Promise.reject(error);
  }
);

// Auth servisi
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
  },
};

// Kullanıcı servisi
export const userService = {
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
  updateProfile: async (userData: any) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
};

// Kurs servisi
export const courseService = {
  getAllCourses: async () => {
    const response = await api.get('/courses');
    return response.data;
  },
  getCourseById: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },
  enrollCourse: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },
};

// Ödev servisi
export const assignmentService = {
  getAllAssignments: async () => {
    const response = await api.get('/assignments');
    return response.data;
  },
  getAssignmentById: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },
  submitAssignment: async (assignmentId: string, submissionData: any) => {
    const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData);
    return response.data;
  },
};

export default api; 