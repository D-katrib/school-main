import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL - use the address where your backend is running
// TODO: Move this to environment variables for different environments
const API_URL = 'http://192.168.1.14:5000/api';

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds token to each request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error interceptor:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles error cases
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      await AsyncStorage.removeItem('authToken');
      // Redirect user to login page
      // This will be handled by navigation hooks in the components
      console.log('Authentication token expired or invalid');
    }
    
    // Log the error for debugging
    console.error('API Error:', error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);

// Authentication service
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

// User service
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

// Course service
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
    const response = await api.post(`/courses/${courseId}/enroll-request`);
    return response.data;
  },
  // Methods for course materials
  getCourseMaterials: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}/materials`);
    return response.data;
  },
  addCourseMaterial: async (courseId: string, materialData: FormData) => {
    const response = await api.post(`/courses/${courseId}/materials`, materialData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  removeCourseMaterial: async (courseId: string, materialId: string) => {
    const response = await api.delete(`/courses/${courseId}/materials/${materialId}`);
    return response.data;
  },
  // Methods for enrollment requests
  getEnrollmentRequests: async () => {
    const response = await api.get('/enrollment-requests');
    return response.data;
  },
};

// Assignment service
export const assignmentService = {
  /**
   * Get all assignments
   * @returns List of assignments
   */
  getAssignments: async () => {
    const response = await api.get('/assignments');
    return response;
  },

  /**
   * Get assignment by ID
   * @param id Assignment ID
   * @returns Assignment details
   */
  getAssignmentById: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response;
  },

  /**
   * Submit an assignment with optional file attachments
   * @param assignmentId Assignment ID
   * @param submissionData Submission data (content and/or files)
   * @param isFormData Whether the submission includes files (FormData)
   * @returns Submission response
   */
  submitAssignment: async (assignmentId: string, submissionData: any, isFormData: boolean = false) => {
    const config: any = {};
    if (isFormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      };
    }
    const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData, config);
    return response;
  },

  /**
   * Get submissions for a specific assignment (teacher view)
   * @param assignmentId Assignment ID
   * @returns List of submissions
   */
  getSubmissions: async (assignmentId: string) => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  /**
   * Get current student's submissions
   * @returns List of student's submissions
   */
  getMySubmissions: async () => {
    const response = await api.get('/assignments/my-submissions');
    return response.data;
  },
};

export default api; 