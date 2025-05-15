import { useState, useEffect } from 'react';
import { userService, courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const StudentEnrollmentManager = ({ courseId, onEnrollmentChange }) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('enrolled');

  // Fetch all students and enrolled students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get course details to get enrolled students and available students
        const courseResponse = await courseService.getCourseById(courseId);
        const course = courseResponse.data.data;
        
        // Set enrolled students
        const enrolled = course.students || [];
        setEnrolledStudents(enrolled);
        
        // Get available students from the course data
        // This assumes the backend is populating the course with availableStudents
        const availableStudents = course.availableStudents || [];
        setStudents(availableStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           student.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter enrolled students based on search term
  const filteredEnrolledStudents = enrolledStudents.filter(student => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           student.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle student selection
  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // Enroll selected students
  const handleEnrollStudents = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setLoading(true);
      setError('');

      await courseService.enrollStudents(courseId, selectedStudents);
      
      // Refresh the data
      const courseResponse = await courseService.getCourseById(courseId);
      const course = courseResponse.data.data;
      
      // Update enrolled students
      setEnrolledStudents(course.students || []);
      
      // Update available students
      const usersResponse = await userService.getUsers();
      const allStudents = usersResponse.data.data.filter(user => user.role === 'student');
      const enrolledIds = course.students.map(student => student._id);
      const availableStudents = allStudents.filter(student => !enrolledIds.includes(student._id));
      
      setStudents(availableStudents);
      setSelectedStudents([]);
      
      // Notify parent component
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      setError('Failed to enroll students');
    } finally {
      setLoading(false);
    }
  };

  // Unenroll selected students
  const handleUnenrollStudents = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setLoading(true);
      setError('');

      await courseService.unenrollStudents(courseId, selectedStudents);
      
      // Refresh the data
      const courseResponse = await courseService.getCourseById(courseId);
      const course = courseResponse.data.data;
      
      // Update enrolled students
      setEnrolledStudents(course.students || []);
      
      // Update available students
      const usersResponse = await userService.getUsers();
      const allStudents = usersResponse.data.data.filter(user => user.role === 'student');
      const enrolledIds = course.students.map(student => student._id);
      const availableStudents = allStudents.filter(student => !enrolledIds.includes(student._id));
      
      setStudents(availableStudents);
      setSelectedStudents([]);
      
      // Notify parent component
      if (onEnrollmentChange) {
        onEnrollmentChange();
      }
    } catch (error) {
      console.error('Error unenrolling students:', error);
      setError('Failed to unenroll students');
    } finally {
      setLoading(false);
    }
  };

  if (loading && students.length === 0 && enrolledStudents.length === 0) {
    return (
      <div className="d-flex justify-content-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-enrollment-manager">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Student Enrollment</h5>
        </div>
        <div className="card-body">
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'enrolled' ? 'active' : ''}`}
                onClick={() => setActiveTab('enrolled')}
              >
                Enrolled Students ({enrolledStudents.length})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'available' ? 'active' : ''}`}
                onClick={() => setActiveTab('available')}
              >
                Available Students ({students.length})
              </button>
            </li>
          </ul>

          <div className="mb-3">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'enrolled' ? (
            <div>
              {filteredEnrolledStudents.length > 0 ? (
                <div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(filteredEnrolledStudents.map(s => s._id));
                                } else {
                                  setSelectedStudents([]);
                                }
                              }}
                              checked={filteredEnrolledStudents.length > 0 && 
                                      selectedStudents.length === filteredEnrolledStudents.length}
                            />
                          </th>
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEnrolledStudents.map(student => (
                          <tr key={student._id}>
                            <td>
                              <input 
                                type="checkbox" 
                                className="form-check-input" 
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleStudentSelection(student._id)}
                              />
                            </td>
                            <td>{student.firstName} {student.lastName}</td>
                            <td>{student.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button 
                      className="btn btn-danger" 
                      disabled={selectedStudents.length === 0 || loading}
                      onClick={handleUnenrollStudents}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-dash me-2"></i>
                          Remove Selected Students
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-people fs-1 text-muted"></i>
                  <p className="text-muted mt-2">No students enrolled in this course</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {filteredStudents.length > 0 ? (
                <div>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input 
                              type="checkbox" 
                              className="form-check-input" 
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudents(filteredStudents.map(s => s._id));
                                } else {
                                  setSelectedStudents([]);
                                }
                              }}
                              checked={filteredStudents.length > 0 && 
                                      selectedStudents.length === filteredStudents.length}
                            />
                          </th>
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => (
                          <tr key={student._id}>
                            <td>
                              <input 
                                type="checkbox" 
                                className="form-check-input" 
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleStudentSelection(student._id)}
                              />
                            </td>
                            <td>{student.firstName} {student.lastName}</td>
                            <td>{student.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="d-flex justify-content-end mt-3">
                    <button 
                      className="btn btn-primary" 
                      disabled={selectedStudents.length === 0 || loading}
                      onClick={handleEnrollStudents}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-plus me-2"></i>
                          Enroll Selected Students
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-people fs-1 text-muted"></i>
                  <p className="text-muted mt-2">No available students found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentManager;
