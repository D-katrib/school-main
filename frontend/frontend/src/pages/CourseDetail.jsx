import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StudentEnrollmentManager from '../components/StudentEnrollmentManager';
import EnrollmentRequestManager from '../components/EnrollmentRequestManager';
import CourseEnrollmentRequest from '../components/CourseEnrollmentRequest';
import CourseMaterials from '../components/CourseMaterials';

const CourseDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    grade: '',
    academicYear: new Date().getFullYear().toString(),
    semester: 'Fall',
    schedule: [{
      day: 'Monday',
      startTime: '',
      endTime: '',
      room: ''
    }],
    syllabus: ''
  });

  const fetchCourse = async () => {
    if (!id || id === 'new') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await courseService.getCourseById(id);
      console.log('Course API Response:', response); // Debug log
      
      if (response.data && response.data.data) {
        setCourse(response.data.data);
      } else {
        console.error('Unexpected API response format:', response);
        setError('Unexpected data format received from server');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course details: ' + (error.userMessage || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addScheduleSlot = () => {
    setFormData(prev => ({
      ...prev,
      schedule: [...prev.schedule, {
        day: 'Monday',
        startTime: '',
        endTime: '',
        room: ''
      }]
    }));
  };

  const removeScheduleSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await courseService.createCourse({
        ...formData,
        teacher: currentUser._id
      });
      navigate(`/courses/${response.data._id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      setError('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      try {
        await courseService.deleteCourse(id);
        navigate('/courses');
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course');
      }
    }
  };

  // Schedule'ı formatlayan yardımcı fonksiyon
  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return 'Not specified';
    }
    
    return schedule.map(s => 
      `${s.day} ${s.startTime}-${s.endTime} (Room: ${s.room})`
    ).join('\n');
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (id === 'new') {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link to="/courses" className="btn btn-outline-primary">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Courses
          </Link>
          {(currentUser?.role === 'admin' || (currentUser?.role === 'teacher' && course?.teacher?._id === currentUser.id)) && (
            <div className="d-flex gap-2">
              <Link to={`/courses/edit/${id}`} className="btn btn-outline-primary">
                <i className="bi bi-pencil me-1"></i>
                Edit
              </Link>
              <button onClick={handleDelete} className="btn btn-outline-danger">
                <i className="bi bi-trash me-1"></i>
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="card shadow border-0 overflow-hidden mb-4">
          <h1 className="text-2xl font-bold mb-6">Create New Course</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Course Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  maxLength={20}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Grade Level *
                </label>
                <input
                  type="number"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="12"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Academic Year *
                </label>
                <input
                  type="text"
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Semester *
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule *
              </label>
              {formData.schedule.map((slot, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <select
                      value={slot.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={slot.room}
                      onChange={(e) => handleScheduleChange(index, 'room', e.target.value)}
                      required
                      placeholder="Room"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleSlot(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addScheduleSlot}
                className="mt-2 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Schedule Slot
              </button>
            </div>

            <div>
              <label htmlFor="syllabus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Syllabus
              </label>
              <textarea
                id="syllabus"
                name="syllabus"
                value={formData.syllabus}
                onChange={handleInputChange}
                rows="4"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                to="/courses"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Course
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course not found</h3>
        <p className="mt-1 text-gray-500 dark:text-gray-400">The course you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <Link to="/courses" className="btn btn-primary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  if (course) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Link to="/courses" className="btn btn-outline-primary d-flex align-items-center">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Courses
          </Link>

          {(currentUser.role === 'admin' || (currentUser.role === 'teacher' && currentUser._id === course.teacher._id)) && (
            <div className="d-flex gap-2">
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                <i className="bi bi-trash me-2"></i>
                Delete Course
              </button>
            </div>
          )}
        </div>

        <div className="card shadow border-0 overflow-hidden mb-4">
          <div className="card-header bg-primary text-white p-4">
            <h1 className="fs-3 fw-bold mb-1">{course.name}</h1>
            <p className="small mb-0">Course Code: {course.code}</p>
          </div>

          <div className="row g-0">
            <div className="col-md-8 p-4">
              <div className="card mb-4 border-0 bg-light">
                <div className="card-body">
                  <h2 className="fs-5 fw-bold mb-3">Course Description</h2>
                  <p className="mb-0">
                    {course.description || 'No description available'}
                  </p>
                </div>
              </div>
              
              <div className="card mb-4 border-0 bg-light">
                <div className="card-body">
                  <h2 className="fs-5 fw-bold mb-3">Schedule</h2>
                  {course.schedule && course.schedule.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Day</th>
                            <th>Time</th>
                            <th>Room</th>
                          </tr>
                        </thead>
                        <tbody>
                          {course.schedule.map((slot, index) => (
                            <tr key={index}>
                              <td>{slot.day}</td>
                              <td>{slot.startTime} - {slot.endTime}</td>
                              <td>{slot.room}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted mb-0">No schedule available</p>
                  )}
                </div>
              </div>

              <div className="card border-0 bg-light">
                <div className="card-body">
                  <h2 className="fs-5 fw-bold mb-3">Course Materials</h2>
                  {course.materials && course.materials.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {course.materials.map((material, index) => (
                        <li key={index} className="list-group-item bg-transparent d-flex align-items-center px-0">
                          <i className="bi bi-file-earmark-text text-primary me-2 fs-5"></i>
                          <a 
                            href={material.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            {material.title}
                            <span className="ms-2 text-muted small">
                              {new Date(material.uploadDate).toLocaleDateString()}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted mb-0">No materials available</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-4 p-4 bg-light">
              <div className="card mb-4 border-0">
                <div className="card-body">
                  <h2 className="fs-5 fw-bold mb-3">Course Details</h2>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item bg-transparent px-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-person-badge fs-4 text-primary me-3"></i>
                        <div>
                          <p className="small text-muted mb-0">Teacher</p>
                          <p className="fw-medium mb-0">
                            {course.teacher?.firstName} {course.teacher?.lastName}
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item bg-transparent px-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-calendar3 fs-4 text-primary me-3"></i>
                        <div>
                          <p className="small text-muted mb-0">Academic Year</p>
                          <p className="fw-medium mb-0">{course.academicYear || 'Not specified'}</p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item bg-transparent px-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-mortarboard fs-4 text-primary me-3"></i>
                        <div>
                          <p className="small text-muted mb-0">Grade Level</p>
                          <p className="fw-medium mb-0">{course.grade || 'Not specified'}</p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item bg-transparent px-0">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-clock fs-4 text-primary me-3"></i>
                        <div>
                          <p className="small text-muted mb-0">Semester</p>
                          <p className="fw-medium mb-0">{course.semester || 'Not specified'}</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="card border-0 mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2 className="fs-5 fw-bold mb-0">Students</h2>
                    <span className="badge bg-primary rounded-pill">{course.students?.length || 0}</span>
                  </div>
                  
                  {course.students && course.students.length > 0 ? (
                    <ul className="list-group list-group-flush">
                      {course.students.map((student) => (
                        <li key={student._id} className="list-group-item bg-transparent px-0 d-flex align-items-center">
                          <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle me-3" 
                               style={{ width: "40px", height: "40px" }}>
                            {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="fw-medium mb-0">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="small text-muted mb-0">
                              {student.email}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-people fs-1 text-muted"></i>
                      <p className="text-muted mt-2 mb-0">No students enrolled</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Student Enrollment Management for Teachers and Admins */}
              {(currentUser?.role === 'admin' || (currentUser?.role === 'teacher' && course.teacher?._id === currentUser.id)) && (
                <div className="mb-4">
                  <StudentEnrollmentManager courseId={id} onEnrollmentChange={() => fetchCourse()} />
                </div>
              )}
              
              {/* Enrollment Request Manager for Teachers and Admins */}
              {(currentUser?.role === 'admin' || (currentUser?.role === 'teacher' && course.teacher?._id === currentUser.id)) && (
                <div className="mb-4">
                  <EnrollmentRequestManager courseId={id} onRequestProcessed={() => fetchCourse()} />
                </div>
              )}
              
              {/* Course Enrollment Request for Students */}
              {currentUser?.role === 'student' && !course.students?.some(student => student._id === currentUser.id) && (
                <div className="mb-4">
                  <CourseEnrollmentRequest courseId={id} courseName={course.name} onRequestSent={() => fetchCourse()} />
                </div>
              )}
              
              {/* Course Materials Section */}
              <div className="card border-0 mb-4">
                <div className="card-body">
                  <CourseMaterials courseId={id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Diğer durumlar için varsayılan görünüm
  return (
    <div className="container py-4">
      <div className="alert alert-warning" role="alert">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Beklenmeyen bir durum oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
      </div>
    </div>
  );
};

export default CourseDetail;
