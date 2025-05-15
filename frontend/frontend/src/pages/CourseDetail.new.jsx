import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id || id === 'new') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await courseService.getCourseById(id);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

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
          <Link to="/courses" className="btn btn-outline-primary d-flex align-items-center">
            <i className="bi bi-arrow-left me-2"></i>
            Back to Courses
          </Link>
        </div>

        <div className="card shadow border-0 overflow-hidden mb-4">
          <div className="card-header bg-primary text-white p-4">
            <h1 className="fs-3 fw-bold mb-0">Create New Course</h1>
          </div>
          
          <div className="card-body p-4">
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Course Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="col-md-6">
                <label htmlFor="code" className="form-label">Course Code</label>
                <input
                  type="text"
                  className="form-control"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="col-12">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              
              <div className="col-md-4">
                <label htmlFor="grade" className="form-label">Grade Level</label>
                <input
                  type="number"
                  className="form-control"
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="col-md-4">
                <label htmlFor="academicYear" className="form-label">Academic Year</label>
                <input
                  type="text"
                  className="form-control"
                  id="academicYear"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="col-md-4">
                <label htmlFor="semester" className="form-label">Semester</label>
                <select
                  className="form-select"
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              
              <div className="col-12 mt-4">
                <h3 className="fs-5 fw-bold mb-3">Schedule</h3>
                
                {formData.schedule.map((slot, index) => (
                  <div key={index} className="row g-3 mb-3 pb-3 border-bottom">
                    <div className="col-md-3">
                      <label className="form-label">Day</label>
                      <select
                        className="form-select"
                        value={slot.day}
                        onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                        required
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
                    
                    <div className="col-md-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={slot.startTime}
                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="col-md-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={slot.endTime}
                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="col-md-2">
                      <label className="form-label">Room</label>
                      <input
                        type="text"
                        className="form-control"
                        value={slot.room}
                        onChange={(e) => handleScheduleChange(index, 'room', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="col-md-1 d-flex align-items-end">
                      {formData.schedule.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => removeScheduleSlot(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={addScheduleSlot}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Add Schedule Slot
                  </button>
                </div>
              </div>
              
              <div className="col-12 mt-4">
                <label htmlFor="syllabus" className="form-label">Syllabus (Optional)</label>
                <textarea
                  className="form-control"
                  id="syllabus"
                  name="syllabus"
                  rows="3"
                  value={formData.syllabus}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              <div className="col-12 mt-4">
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-save me-2"></i>
                  Create Course
                </button>
                <Link to="/courses" className="btn btn-outline-secondary ms-2">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
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

              <div className="card border-0">
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
