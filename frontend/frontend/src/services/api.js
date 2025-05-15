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
  getStudentCourses: () => api.get('/courses/my-courses'),
  getCourseMaterials: (courseId) => {
    return api.get(`/courses/${courseId}/materials`);
  },
  
  // Add course material
  addCourseMaterial: (courseId, materialData, isFormData = false) => {
    const config = {};
    
    // If sending form data (for file uploads), set the appropriate content type
    if (isFormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      };
    }
    
    return api.post(`/courses/${courseId}/materials`, materialData, config);
  },
  
  // Remove course material
  removeCourseMaterial: (courseId, materialId) => {
    return api.delete(`/courses/${courseId}/materials/${materialId}`);
  },
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollStudents: (courseId, studentIds) => api.put(`/courses/${courseId}/enroll`, { studentIds }),
  unenrollStudents: (courseId, studentIds) => api.put(`/courses/${courseId}/unenroll`, { studentIds }),
  getEnrollmentRequests: (courseId) => api.get(`/courses/${courseId}/enrollment-requests`),
  processEnrollmentRequest: (requestId, status, notes) => api.put(`/enrollment-requests/${requestId}`, { status, notes }),
};

// Enrollment request services
export const enrollmentRequestService = {
  getMyRequests: () => api.get('/enrollment-requests'),
  createRequest: (courseId) => api.post(`/courses/${courseId}/enroll-request`),
  processRequest: (requestId, status, notes) => api.put(`/enrollment-requests/${requestId}`, { status, notes }),
  cancelRequest: (requestId) => api.delete(`/enrollment-requests/${requestId}`),
};

// Assignment services
export const assignmentService = {
  getAssignments: () => api.get('/assignments'),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  createAssignment: (assignmentData, isFormData = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post('/assignments', assignmentData, config);
  },
  updateAssignment: (id, assignmentData, isFormData = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put(`/assignments/${id}`, assignmentData, config);
  },
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  submitAssignment: (assignmentId, submissionData, isFormData = false) => {
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.post(`/assignments/${assignmentId}/submit`, submissionData, config);
  },
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, gradeData) => api.put(`/assignments/submissions/${submissionId}`, gradeData),
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
