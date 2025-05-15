import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Courses = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Schedule'ı formatlayan yardımcı fonksiyon
  const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return 'Not specified';
    }
    
    // İlk 2 ders saatini göster, daha fazlaysa "..." ekle
    return schedule.slice(0, 2).map(s => 
      `${s.day} ${s.startTime}-${s.endTime}`
    ).join(', ') + (schedule.length > 2 ? '...' : '');
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await courseService.getCourses();
        console.log('API Response:', response); // Debug için log eklendi
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setCourses(response.data.data);
        } else {
          console.error('Unexpected API response format:', response);
          setError('Unexpected data format received from server');
          setCourses([]);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to load courses: ' + (error.userMessage || error.message || 'Unknown error'));
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h1 className="fs-2 fw-bold mb-0">Courses</h1>
        {currentUser?.role === 'admin' || currentUser?.role === 'teacher' ? (
          <Link to="/courses/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-1"></i>
            Add New Course
          </Link>
        ) : null}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {courses.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {courses.map((course) => (
            <div className="col" key={course._id}>
              <Link
                to={`/courses/${course._id}`}
                className="text-decoration-none"
              >
                <div className="card h-100 shadow-sm transition-hover">
                  <div className="bg-primary text-white text-center py-4" style={{ background: "linear-gradient(to right, var(--bs-primary), var(--bs-indigo))" }}>
                    <h3 className="fs-4 fw-bold">{course.name}</h3>
                  </div>
                  <div className="card-body">
                    <p className="card-text text-muted small mb-1">
                      <span className="fw-medium">Teacher:</span> {course.teacher?.firstName} {course.teacher?.lastName}
                    </p>
                    <p className="card-text text-muted small mb-1">
                      <span className="fw-medium">Schedule:</span> {formatSchedule(course.schedule)}
                    </p>
                    <p className="card-text text-muted small mb-3">
                      <span className="fw-medium">Students:</span> {course.students?.length || 0}
                    </p>
                    <div>
                      <p className="card-text small text-truncate" style={{ maxHeight: "3rem", overflow: "hidden" }}>
                        {course.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-journal-text fs-1 text-muted"></i>
          <h3 className="mt-3 fs-5 fw-medium">No courses found</h3>
          <p className="text-muted">Get started by creating a new course.</p>
          {currentUser?.role === 'admin' || currentUser?.role === 'teacher' ? (
            <div className="mt-3">
              <Link to="/courses/new" className="btn btn-primary">
                <i className="bi bi-plus-circle me-1"></i>
                Add New Course
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Courses;
