import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL configuration
// Choose the appropriate URL based on your environment
// For development, you may need to use your computer's actual IP address

// IMPORTANT: The backend server is already running on port 5000
// Try each of these URLs one at a time by uncommenting only one option

// For Android Emulator (maps to host machine's localhost)
// const API_URL = 'http://10.0.2.2:5000/api';

// For iOS Simulator
// const API_URL = 'http://localhost:5000/api';

// Using your computer's actual local IP address from the Wi-Fi adapter
// This allows Expo on a physical device to connect to your backend
const API_URL = 'http://10.192.32.29:5000/api';

// Alternative localhost option
// const API_URL = 'http://localhost:5000/api';

// For physical device on same network (replace with your computer's actual IP)
// const API_URL = 'http://192.168.1.14:5000/api';  // Original IP

// Create Axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout to 30 seconds
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
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      console.error('API Timeout Error: Request took too long to complete');
    } else if (error.message === 'Network Error') {
      console.error('API Network Error: Cannot connect to the server. Check if the server is running and accessible');
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      
      if (error.response.status === 401) {
        // Token is invalid or expired
        await AsyncStorage.removeItem('authToken');
        // Redirect user to login page will be handled by navigation hooks in the components
        console.log('Authentication token expired or invalid');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error: No response received', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Setup:', error.message);
    }
    
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
    // The backend returns data in format: { count, data: [...courses], pagination, success }
    // We need to return the courses array from the data property
    if (response.data && response.data.data) {
      return response.data.data; // Return the courses array
    } else {
      console.error('Unexpected API response format:', JSON.stringify(response.data));
      throw new Error('Unexpected API response format');
    }
  },
  getCourseById: async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    // The backend returns data in format: { data: {course}, success }
    if (response.data && response.data.data) {
      return response.data.data; // Return the course object
    } else {
      console.error('Unexpected API response format:', JSON.stringify(response.data));
      throw new Error('Unexpected API response format');
    }
  },
  enrollCourse: async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll-request`);
    // Handle response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  // Methods for course materials
  getCourseMaterials: async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}/materials`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  addCourseMaterial: async (courseId: string, materialData: FormData) => {
    const response = await api.post(`/courses/${courseId}/materials`, materialData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  removeCourseMaterial: async (courseId: string, materialId: string) => {
    const response = await api.delete(`/courses/${courseId}/materials/${materialId}`);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  // Methods for enrollment requests
  getEnrollmentRequests: async () => {
    const response = await api.get('/enrollment-requests');
    if (response.data && response.data.data) {
      return response.data.data;
    }
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
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Get assignment by ID
   * @param id Assignment ID
   * @returns Assignment details
   */
  getAssignmentById: async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
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
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Get submissions for a specific assignment (teacher view)
   * @param assignmentId Assignment ID
   * @returns List of submissions
   */
  getSubmissions: async (assignmentId: string) => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Get current student's submissions
   * @returns List of student's submissions
   */
  getMySubmissions: async () => {
    const response = await api.get('/assignments/my-submissions');
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Create a new assignment
   * @param assignmentData Assignment data including title, description, course, dueDate, etc.
   * @param isFormData Whether the data includes files (FormData)
   * @returns Created assignment
   */
  createAssignment: async (assignmentData: any, isFormData: boolean = false) => {
    const config: any = {};
    if (isFormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      };
    }
    const response = await api.post('/assignments', assignmentData, config);
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },

  /**
   * Delete an assignment by ID
   * @param id Assignment ID
   * @returns Deletion response
   */
  deleteAssignment: async (id: string) => {
    const response = await api.delete(`/assignments/${id}`);
    // Handle the response format consistently
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
};

export default api; 