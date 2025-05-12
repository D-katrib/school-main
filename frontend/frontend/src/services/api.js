import axios from 'axios';

// API URL from environment variable or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request and response tracking
let pendingRequests = 0;
const requestStarted = () => {
  pendingRequests++;
  document.body.classList.add('api-loading');
};

const requestEnded = () => {
  pendingRequests--;
  if (pendingRequests <= 0) {
    pendingRequests = 0;
    document.body.classList.remove('api-loading');
  }
};

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    requestStarted();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    requestEnded();
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    requestEnded();
    return response;
  },
  async (error) => {
    requestEnded();

    const originalRequest = error.config;

    // Handle token refresh on 401 errors
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Check if this isn't already a refresh token request to prevent loops
      if (!originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;
        
        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const res = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken
            });
            
            if (res.data.token) {
              localStorage.setItem('token', res.data.token);
              originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          // If refresh failed, log out user
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      
      // If we reached here, logout the user
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    
    // Special handling for network errors or server down
    if (error.code === 'ECONNABORTED' || !error.response) {
      const customError = new Error('Network error. Please check your connection.');
      customError.isNetworkError = true;
      return Promise.reject(customError);
    }
    
    // Add user-friendly error message
    let errorMessage = 'An unexpected error occurred';
    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 400:
          errorMessage = error.response.data?.message || 'Invalid request';
          break;
        case 403:
          errorMessage = 'You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = 'The requested resource was not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
        default:
          errorMessage = error.response.data?.message || 'An error occurred';
      }
      error.userMessage = errorMessage;
    }

    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// User services
export const userService = {
  getUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Course services
export const courseService = {
  getCourses: () => api.get('/courses'),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollStudent: (courseId, studentId) => api.post(`/courses/${courseId}/enroll`, { studentId }),
  removeStudent: (courseId, studentId) => api.delete(`/courses/${courseId}/students/${studentId}`),
};

// Assignment services
export const assignmentService = {
  getAssignments: () => api.get('/assignments'),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  createAssignment: (assignmentData) => api.post('/assignments', assignmentData),
  updateAssignment: (id, assignmentData) => api.put(`/assignments/${id}`, assignmentData),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  submitAssignment: (assignmentId, submissionData) => api.post(`/assignments/${assignmentId}/submit`, submissionData),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
};

// Attendance services
export const attendanceService = {
  getAttendance: (courseId, date) => api.get('/attendance', { params: { course: courseId, date } }),
  markAttendance: (attendanceData) => api.post('/attendance', attendanceData),
  updateAttendance: (id, attendanceData) => api.put(`/attendance/${id}`, attendanceData),
};

// Grade services
export const gradeService = {
  getGrades: (studentId, courseId) => api.get('/grades', { params: { studentId, courseId } }),
  createGrade: (gradeData) => api.post('/grades', gradeData),
  updateGrade: (id, gradeData) => api.put(`/grades/${id}`, gradeData),
  deleteGrade: (id) => api.delete(`/grades/${id}`),
};

// Notification services
export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Helper function to handle API errors in components
export const handleApiError = (error) => {
  if (error.isNetworkError) {
    return 'Network error. Please check your connection.';
  }
  
  return error.userMessage || error.response?.data?.message || 'An unexpected error occurred';
};

export default api;
