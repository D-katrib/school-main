import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentService, courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AssignmentForm = ({ assignment, isEdit = false }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    dueDate: '',
    totalPoints: 100,
    assignmentType: 'Homework',
    allowLateSubmissions: false,
    latePenalty: 0,
    isPublished: true
  });

  // File upload state
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  
  // Load courses for dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getCourses();
        // Filter courses based on user role
        let availableCourses = [];
        if (currentUser.role === 'admin') {
          // Admin can see all courses
          availableCourses = response.data.data || [];
        } else if (currentUser.role === 'teacher') {
          // Teachers can only see their courses
          availableCourses = (response.data.data || []).filter(
            course => course.teacher?._id === currentUser._id || course.teacher === currentUser._id
          );
        }
        setCourses(availableCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses');
      }
    };

    fetchCourses();
  }, [currentUser]);

  // If editing, populate form with assignment data
  useEffect(() => {
    if (isEdit && assignment) {
      const dueDate = new Date(assignment.dueDate);
      // Format date to YYYY-MM-DDThh:mm
      const formattedDate = dueDate.toISOString().slice(0, 16);
      
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        course: assignment.course?._id || assignment.course || '',
        dueDate: formattedDate,
        totalPoints: assignment.totalPoints || 100,
        assignmentType: assignment.assignmentType || 'Homework',
        allowLateSubmissions: assignment.allowLateSubmissions || false,
        latePenalty: assignment.latePenalty || 0,
        isPublished: assignment.isPublished !== undefined ? assignment.isPublished : true
      });
    }
  }, [assignment, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Validate file size (max 5MB per file)
    const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      setFileError('Some files exceed the 5MB size limit');
      return;
    }
    
    setFiles(selectedFiles);
    setFileError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.course || !formData.dueDate) {
        throw new Error('Please fill in all required fields');
      }
      
      // Prepare form data for API
      const assignmentData = {
        ...formData,
        totalPoints: Number(formData.totalPoints),
        latePenalty: Number(formData.latePenalty)
      };
      
      // Handle file uploads if any
      if (files.length > 0) {
        // Create FormData for file upload
        const formDataWithFiles = new FormData();
        
        // Append assignment data
        Object.keys(assignmentData).forEach(key => {
          formDataWithFiles.append(key, assignmentData[key]);
        });
        
        // Append files
        files.forEach(file => {
          formDataWithFiles.append('files', file);
        });
        
        // Use the FormData object for the API call
        if (isEdit) {
          await assignmentService.updateAssignment(assignment._id, formDataWithFiles, true);
        } else {
          await assignmentService.createAssignment(formDataWithFiles, true);
        }
      } else {
        // No files to upload, use regular JSON
        if (isEdit) {
          await assignmentService.updateAssignment(assignment._id, assignmentData);
        } else {
          await assignmentService.createAssignment(assignmentData);
        }
      }
      
      setSuccess(true);
      // Redirect after successful submission
      setTimeout(() => {
        navigate('/assignments');
      }, 1500);
    } catch (error) {
      console.error('Error saving assignment:', error);
      setError(error.message || 'Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h1 className="fs-4 fw-bold mb-4">{isEdit ? 'Edit Assignment' : 'Create New Assignment'}</h1>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success" role="alert">
            Assignment {isEdit ? 'updated' : 'created'} successfully!
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title <span className="text-danger">*</span></label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="course" className="form-label">Course <span className="text-danger">*</span></label>
              <select
                className="form-select"
                id="course"
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.name} ({course.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-md-6">
              <label htmlFor="assignmentType" className="form-label">Assignment Type</label>
              <select
                className="form-select"
                id="assignmentType"
                name="assignmentType"
                value={formData.assignmentType}
                onChange={handleChange}
              >
                <option value="Homework">Homework</option>
                <option value="Quiz">Quiz</option>
                <option value="Test">Test</option>
                <option value="Project">Project</option>
                <option value="Essay">Essay</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="dueDate" className="form-label">Due Date <span className="text-danger">*</span></label>
              <input
                type="datetime-local"
                className="form-control"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-md-6">
              <label htmlFor="totalPoints" className="form-label">Total Points</label>
              <input
                type="number"
                className="form-control"
                id="totalPoints"
                name="totalPoints"
                min="0"
                value={formData.totalPoints}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allowLateSubmissions"
                  name="allowLateSubmissions"
                  checked={formData.allowLateSubmissions}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="allowLateSubmissions">
                  Allow Late Submissions
                </label>
              </div>
            </div>
            
            <div className="col-md-6">
              <label htmlFor="latePenalty" className="form-label">Late Penalty (%)</label>
              <input
                type="number"
                className="form-control"
                id="latePenalty"
                name="latePenalty"
                min="0"
                max="100"
                value={formData.latePenalty}
                onChange={handleChange}
                disabled={!formData.allowLateSubmissions}
              />
            </div>
          </div>
          
          <div className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="isPublished">
                Publish Assignment (visible to students)
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="files" className="form-label">Attachments (optional)</label>
            <input
              type="file"
              className={`form-control ${fileError ? 'is-invalid' : ''}`}
              id="files"
              multiple
              onChange={handleFileChange}
            />
            {fileError && <div className="invalid-feedback">{fileError}</div>}
            <div className="form-text">You can upload multiple files (max 5MB each).</div>
          </div>
          
          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate('/assignments')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{isEdit ? 'Update Assignment' : 'Create Assignment'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentForm;
