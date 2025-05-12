import { useState, useEffect } from 'react';
import { attendanceService, courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Attendance = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedDate) {
      fetchAttendance();
    }
  }, [selectedCourse, selectedDate]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses();
      // Convert object to array if needed
      const coursesArray = Array.isArray(response.data) ? response.data : Object.values(response.data);
      setCourses(coursesArray);
      if (coursesArray.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesArray[0]._id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
      setCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendance(selectedCourse, selectedDate);
      // Convert object to array if needed
      const attendanceArray = Array.isArray(response.data) ? response.data : Object.values(response.data);
      setAttendanceData(attendanceArray);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance data');
      setAttendanceData([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = async (studentId, status) => {
    try {
      await attendanceService.markAttendance({
        courseId: selectedCourse,
        date: selectedDate,
        studentId,
        status
      });
      
      // Update local state
      setAttendanceData(prevData => 
        prevData.map(item => 
          item.student._id === studentId 
            ? { ...item, status } 
            : item
        )
      );
    } catch (error) {
      console.error('Error updating attendance:', error);
      setError('Failed to update attendance');
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';

  return (
    <div className="container py-4">
      <h1 className="fs-2 fw-bold mb-4">Attendance</h1>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="course" className="form-label fw-medium">
                Select Course
              </label>
              <select
                id="course"
                className="form-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option key="default" value="">Select a course</option>
                {courses.map((course, index) => (
                  <option key={course._id || `course-${index}-${course.name || 'untitled'}`} value={course._id}>
                    {course.name || 'Untitled Course'}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="date" className="form-label fw-medium">
                Select Date
              </label>
              <input
                type="date"
                id="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>
      </div>

      {selectedCourse && selectedDate ? (
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h5 className="card-title mb-1 fw-bold">
              Attendance for {formatDate(selectedDate)}
            </h5>
            <p className="text-muted small mb-0">
              {courses.find(c => c._id === selectedCourse)?.name || 'Selected Course'}
            </p>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : attendanceData.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="fw-semibold text-uppercase fs-7">
                      Student
                    </th>
                    <th scope="col" className="fw-semibold text-uppercase fs-7">
                      Status
                    </th>
                    {isTeacherOrAdmin && (
                      <th scope="col" className="fw-semibold text-uppercase fs-7">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((attendance) => (
                    <tr key={attendance._id || `${attendance.student?._id}-${selectedDate}`}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary" style={{width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold'}}>
                            {attendance.student?.firstName?.charAt(0)}{attendance.student?.lastName?.charAt(0)}
                          </div>
                          <div className="ms-3">
                            <div className="fw-semibold">
                              {attendance.student?.firstName} {attendance.student?.lastName}
                            </div>
                            <div className="text-muted small">
                              {attendance.student?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${
                          attendance.status === 'present' 
                            ? 'bg-success' 
                            : attendance.status === 'absent'
                            ? 'bg-danger'
                            : attendance.status === 'late'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary'
                        }`}>
                          {attendance.status ? attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1) : 'Not marked'}
                        </span>
                      </td>
                      {isTeacherOrAdmin && (
                        <td>
                          <div className="btn-group" role="group">
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(attendance.student._id, 'present')}
                              className={`btn btn-sm ${
                                attendance.status === 'present' ? 'btn-success' : 'btn-outline-success'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(attendance.student._id, 'late')}
                              className={`btn btn-sm ${
                                attendance.status === 'late' ? 'btn-warning' : 'btn-outline-warning'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttendanceChange(attendance.student._id, 'absent')}
                              className={`btn btn-sm ${
                                attendance.status === 'absent' ? 'btn-danger' : 'btn-outline-danger'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x fs-1 text-muted"></i>
              <h3 className="mt-3 fs-5 fw-medium">No attendance data found</h3>
              <p className="text-muted">
                {isTeacherOrAdmin
                  ? "No students are enrolled in this course or attendance hasn't been recorded yet."
                  : "Attendance hasn't been recorded for this date."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-calendar fs-1 text-muted"></i>
          <h3 className="mt-3 fs-5 fw-medium">Select a course and date</h3>
          <p className="text-muted">Please select a course and date to view attendance records.</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;