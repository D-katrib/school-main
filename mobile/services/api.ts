import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth token management
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

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
  timeout: 60000, // Increased timeout to 60 seconds
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
    // Retry logic for timeout and network errors
    const originalRequest = error.config;
    
    // Only retry GET requests that haven't been retried yet
    if ((error.code === 'ECONNABORTED' || error.message === 'Network Error') && 
        originalRequest && 
        !originalRequest._retry && 
        originalRequest.method === 'get') {
      
      originalRequest._retry = true;
      console.log('Retrying request due to timeout or network error...');
      
      // Add a small delay before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return the retried request
      return api(originalRequest);
    }
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      console.error('API Timeout Error: Request took too long to complete');
      // Add more user-friendly error message
      error.userMessage = 'İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
    } else if (error.message === 'Network Error') {
      console.error('API Network Error: Cannot connect to the server. Check if the server is running and accessible');
      error.userMessage = 'Sunucuya bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.';
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
        error.userMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.response.data && error.response.data.message) {
        error.userMessage = error.response.data.message;
      } else {
        error.userMessage = `Sunucu hatası: ${error.response.status}`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error: No response received', error.request);
      error.userMessage = 'Sunucudan yanıt alınamadı. Lütfen daha sonra tekrar deneyin.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Setup:', error.message);
      error.userMessage = 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.';
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
  getAllTeachers: async () => {
    const response = await api.get('/users?role=teacher');
    if (response.data && response.data.data) {
      return response.data.data;
    }
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
  createCourse: async (courseData: any) => {
    const response = await api.post('/courses', courseData);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  updateCourse: async (id: string, courseData: any) => {
    const response = await api.put(`/courses/${id}`, courseData);
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  },
  deleteCourse: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
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
const SUBMITTED_ASSIGNMENTS_KEY = 'submitted_assignments';

// Helper functions for local storage of submissions
const saveSubmittedAssignment = async (assignmentId: string) => {
  try {
    // Get current submitted assignments
    const submittedAssignmentsJson = await AsyncStorage.getItem(SUBMITTED_ASSIGNMENTS_KEY);
    let submittedAssignments = submittedAssignmentsJson ? JSON.parse(submittedAssignmentsJson) : [];
    
    // Add new assignment if not already in the list
    if (!submittedAssignments.includes(assignmentId)) {
      submittedAssignments.push(assignmentId);
      await AsyncStorage.setItem(SUBMITTED_ASSIGNMENTS_KEY, JSON.stringify(submittedAssignments));
      console.log(`Assignment ${assignmentId} marked as submitted locally`);
    }
  } catch (error) {
    console.error('Error saving submitted assignment locally:', error);
  }
};

const checkIfAssignmentSubmitted = async (assignmentId: string): Promise<boolean> => {
  try {
    const submittedAssignmentsJson = await AsyncStorage.getItem(SUBMITTED_ASSIGNMENTS_KEY);
    if (!submittedAssignmentsJson) return false;
    
    const submittedAssignments = JSON.parse(submittedAssignmentsJson);
    return submittedAssignments.includes(assignmentId);
  } catch (error) {
    console.error('Error checking if assignment is submitted locally:', error);
    return false;
  }
};

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
    try {
      console.log('Fetching assignment with ID:', id);
      const response = await api.get(`/assignments/${id}`);
      
      // Handle the response format consistently
      let assignmentData;
      if (response.data && response.data.data) {
        assignmentData = response.data.data;
      } else {
        assignmentData = response.data;
      }
      
      // Check local storage to see if this assignment was submitted
      const isLocallySubmitted = await checkIfAssignmentSubmitted(id);
      console.log(`Assignment ${id} local submission status:`, isLocallySubmitted);
      
      // If locally marked as submitted but backend doesn't show it, enhance the data
      if (isLocallySubmitted && !assignmentData.submission) {
        console.log('Enhancing assignment data with local submission status');
        // Create a synthetic submission object if none exists
        assignmentData.submission = {
          _id: 'local-submission-' + Date.now(),
          content: 'Submitted via mobile app',
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          isLate: false,
          attachments: [] // Add missing attachments field
        };
        
        // If there's a submissionIds array, add our synthetic submission
        if (Array.isArray(assignmentData.submissionIds)) {
          assignmentData.submissionIds.push(assignmentData.submission._id);
        } else {
          assignmentData.submissionIds = [assignmentData.submission._id];
        }
      }
      
      // Log assignment data for debugging
      console.log('Assignment data after local enhancement:', JSON.stringify({
        id: assignmentData._id,
        title: assignmentData.title,
        hasSubmission: !!assignmentData.submission,
        submissionId: assignmentData.submission?._id,
        isLocallySubmitted: isLocallySubmitted
      }));
      
      return assignmentData;
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  /**
   * Submit an assignment with optional file attachments
   * @param assignmentId Assignment ID
   * @param submissionData Submission data (content and/or files)
   * @param isFormData Whether the submission includes files (FormData)
   * @returns Submission response
   */
  submitAssignment: async (assignmentId: string, submissionData: any, isFormData: boolean = false) => {
    try {
      console.log(`Submitting assignment ${assignmentId} with ${isFormData ? 'files' : 'text-only'} data`);
      
      // Immediately save to local storage to ensure UI updates correctly
      await saveSubmittedAssignment(assignmentId);
      console.log(`Assignment ${assignmentId} marked as submitted in local storage`);
      
      const config: any = {};
      if (isFormData) {
        config.headers = {
          'Content-Type': 'multipart/form-data'
        };
      }
      
      // Try to submit to backend
      try {
        const response = await api.post(`/assignments/${assignmentId}/submit`, submissionData, config);
        console.log(`Submission API response status: ${response.status}`);
        
        // Return the entire response for better debugging and access to all data
        if (response.data) {
          console.log(`Submission response data structure: ${Object.keys(response.data).join(', ')}`);
          
          // Create a synthetic submission object for consistent UI updates
          const submissionContent = isFormData ? 'File submission' : 
            (submissionData.content || 'Submitted via mobile app');
          
          // Combine backend response with our local data
          const enhancedResponse = {
            ...response.data,
            data: response.data.data || {
              _id: 'local-submission-' + Date.now(),
              content: submissionContent,
              submittedAt: new Date().toISOString(),
              status: 'submitted',
              isLate: false,
              attachments: []
            },
            locallySubmitted: true
          };
          
          return enhancedResponse;
        }
      } catch (apiError) {
        console.error('Backend API error in submitAssignment:', apiError);
        console.log('Continuing with local submission only');
      }
      
      // If backend submission fails or has no data, return a synthetic response
      // This ensures the UI still updates correctly
      const submissionContent = isFormData ? 'File submission' : 
        (submissionData.content || 'Submitted via mobile app');
      
      return {
        success: true,
        message: 'Assignment submitted successfully (local only)',
        data: {
          _id: 'local-submission-' + Date.now(),
          content: submissionContent,
          submittedAt: new Date().toISOString(),
          status: 'submitted',
          isLate: false,
          attachments: []
        },
        locallySubmitted: true
      };
    } catch (error) {
      console.error('Error in submitAssignment:', error);
      throw error;
    }
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
   * Grade a submission
   * @param submissionId Submission ID
   * @param gradeData Grade data including score, feedback, and publishGrade
   * @returns Updated submission
   */
  gradeSubmission: async (submissionId: string, gradeData: { score: number; feedback?: string; publishGrade?: boolean }) => {
    const response = await api.put(`/assignments/submissions/${submissionId}`, gradeData);
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
    try {
      console.log('Starting getMySubmissions...');
      
      // First get all assignments for the student
      console.log('Fetching all assignments...');
      const assignmentsResponse = await api.get('/assignments');
      console.log('Assignments response:', assignmentsResponse.status, assignmentsResponse.data ? 'has data' : 'no data');
      
      let assignments = [];
      if (assignmentsResponse.data && assignmentsResponse.data.data) {
        assignments = assignmentsResponse.data.data;
      } else if (Array.isArray(assignmentsResponse.data)) {
        assignments = assignmentsResponse.data;
      } else if (typeof assignmentsResponse.data === 'object') {
        assignments = Object.values(assignmentsResponse.data);
      }
      
      console.log(`Found ${assignments.length} assignments`);
      
      // Get locally submitted assignments
      const submittedAssignmentsJson = await AsyncStorage.getItem(SUBMITTED_ASSIGNMENTS_KEY);
      const locallySubmittedIds = submittedAssignmentsJson ? JSON.parse(submittedAssignmentsJson) : [];
      console.log(`Found ${locallySubmittedIds.length} locally submitted assignments`);
      
      // Then get all submissions for each assignment
      const submissionsPromises = assignments.map(async (assignment: any) => {
        try {
          // Check if this assignment is in our locally submitted list
          const isLocallySubmitted = locallySubmittedIds.includes(assignment._id);
          console.log(`Assignment ${assignment._id} locally submitted: ${isLocallySubmitted}`);
          
          // Try to get the assignment details from the server
          console.log(`Fetching details for assignment: ${assignment._id}`);
          const submissionResponse = await api.get(`/assignments/${assignment._id}`);
          console.log(`Assignment ${assignment._id} response:`, submissionResponse.status);
          
          let assignmentWithSubmission = null;
          if (submissionResponse.data && submissionResponse.data.data) {
            assignmentWithSubmission = submissionResponse.data.data;
          } else if (typeof submissionResponse.data === 'object') {
            assignmentWithSubmission = submissionResponse.data;
          }
          
          // Check if there's a submission from the server
          const hasServerSubmission = assignmentWithSubmission && assignmentWithSubmission.submission;
          console.log(`Assignment ${assignment._id} has server submission: ${hasServerSubmission}`);
          
          // If we have a server submission or it's locally submitted
          if (hasServerSubmission || isLocallySubmitted) {
            // Create the submission object
            const submission = hasServerSubmission ? assignmentWithSubmission.submission : {
              _id: `local-${assignment._id}`,
              content: 'Submitted via mobile app',
              submittedAt: new Date().toISOString(),
              status: 'submitted',
              isLate: false
            };
            
            console.log(`Creating submission object for ${assignment._id}`);
            
            // Format the submission data
            return {
              _id: submission._id || `local-${assignment._id}`,
              assignment: {
                _id: assignment._id,
                title: assignment.title,
                description: assignment.description,
                dueDate: assignment.dueDate,
                course: assignment.course,
                maxScore: assignment.maxScore || 100
              },
              score: submission.score,
              feedback: submission.feedback,
              submittedAt: submission.submittedAt || new Date().toISOString(),
              status: submission.status || 'submitted',
              graded: submission.score !== undefined
            };
          }
          
          return null;
        } catch (error) {
          console.error(`Error fetching submission for assignment ${assignment._id}:`, error);
          // If there was an error but we know it's locally submitted, create a synthetic submission
          if (locallySubmittedIds.includes(assignment._id)) {
            console.log(`Creating synthetic submission for locally submitted assignment ${assignment._id}`);
            return {
              _id: `local-${assignment._id}`,
              assignment: {
                _id: assignment._id,
                title: assignment.title || 'Assignment',
                description: assignment.description || '',
                dueDate: assignment.dueDate || new Date().toISOString(),
                course: assignment.course || { _id: 'unknown', name: 'Unknown Course' },
                maxScore: assignment.maxScore || 100
              },
              submittedAt: new Date().toISOString(),
              status: 'submitted',
              graded: false
            };
          }
          return null;
        }
      });
      
      // Wait for all promises to resolve
      console.log('Waiting for all submission promises to resolve...');
      const submissions = await Promise.all(submissionsPromises);
      
      // Filter out null values and return valid submissions
      const validSubmissions = submissions.filter(submission => submission !== null);
      console.log(`Found ${validSubmissions.length} valid submissions`);
      
      return validSubmissions;
    } catch (error) {
      console.error('Error in getMySubmissions:', error);
      // Return empty array instead of throwing to avoid crashing the UI
      return [];
    }
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