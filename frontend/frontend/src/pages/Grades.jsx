import { useState, useEffect } from 'react';
import { gradeService, courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Grades = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchGrades();
    }
  }, [selectedCourse]);

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

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const studentId = currentUser.role === 'student' ? currentUser._id : null;
      const response = await gradeService.getGrades(studentId, selectedCourse);
      // Convert object to array if needed
      const gradesArray = Array.isArray(response.data) ? response.data : Object.values(response.data);
      setGrades(gradesArray);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError('Failed to load grades');
      setGrades([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Calculate letter grade from numeric grade
  const calculateLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Calculate GPA from numeric grade
  const calculateGPA = (score) => {
    if (score >= 90) return 4.0;
    if (score >= 87) return 3.7;
    if (score >= 83) return 3.3;
    if (score >= 80) return 3.0;
    if (score >= 77) return 2.7;
    if (score >= 73) return 2.3;
    if (score >= 70) return 2.0;
    if (score >= 67) return 1.7;
    if (score >= 63) return 1.3;
    if (score >= 60) return 1.0;
    return 0.0;
  };

  // Calculate overall grade for a student
  const calculateOverallGrade = (studentGrades) => {
    if (!studentGrades || studentGrades.length === 0) return 'N/A';
    
    const totalPoints = studentGrades.reduce((sum, grade) => sum + grade.score, 0);
    const average = totalPoints / studentGrades.length;
    
    return average.toFixed(1);
  };

  const isTeacherOrAdmin = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  return (
    <div className="container py-4">
      <h1 className="fs-2 fw-bold mb-4">Grades</h1>

      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="card mb-4 shadow-sm">
        <div className="card-body">
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
      </div>

      {selectedCourse ? (
        <div className="card shadow-sm">
          <div className="card-header bg-light">
            <h5 className="card-title mb-0 fw-bold">
              Grades for {courses.find(c => c._id === selectedCourse)?.name || 'Selected Course'}
            </h5>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : grades.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {isTeacherOrAdmin && (
                      <th scope="col" className="fw-semibold text-uppercase fs-7">
                        Student
                      </th>
                    )}
                    <th scope="col" className="fw-semibold text-uppercase fs-7">
                      Assignment
                    </th>
                    <th scope="col" className="fw-semibold text-uppercase fs-7">
                      Score
                    </th>
                    <th scope="col" className="fw-semibold text-uppercase fs-7">
                      Grade
                    </th>
                    <th scope="col" className="fw-semibold text-uppercase fs-7">
                      Feedback
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((grade) => (
                    <tr key={grade._id || `${grade.student?._id}-${grade.assignment?._id}`}>
                      {isTeacherOrAdmin && (
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="d-flex align-items-center justify-content-center rounded-circle bg-light text-secondary" style={{width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold'}}>
                              {grade.student?.firstName?.charAt(0)}{grade.student?.lastName?.charAt(0)}
                            </div>
                            <div className="ms-3">
                              <div className="fw-semibold">
                                {grade.student?.firstName} {grade.student?.lastName}
                              </div>
                              <div className="text-muted small">
                                {grade.student?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td>
                        <div>{grade.assignment?.title}</div>
                        <div className="text-muted small">Type: {grade.type || 'Assignment'}</div>
                      </td>
                      <td>
                        <div>{grade.score} / {grade.maxScore || 100}</div>
                        <div className="text-muted small">{(grade.score / (grade.maxScore || 100) * 100).toFixed(1)}%</div>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${
                          grade.score >= 90 
                            ? 'bg-success' 
                            : grade.score >= 80
                            ? 'bg-primary'
                            : grade.score >= 70
                            ? 'bg-warning'
                            : grade.score >= 60
                            ? 'bg-warning text-dark'
                            : 'bg-danger'
                        }`}>
                          {calculateLetterGrade(grade.score)} ({calculateGPA(grade.score).toFixed(1)})
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{maxWidth: '200px'}}>
                          {grade.feedback || 'No feedback provided'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={isTeacherOrAdmin ? 2 : 1} className="fw-bold">
                      Overall Grade
                    </td>
                    <td>
                      {grades.length > 0 ? calculateOverallGrade(grades) : 'N/A'}
                    </td>
                    <td>
                      {grades.length > 0 ? (
                        <span className={`badge rounded-pill ${
                          calculateOverallGrade(grades) >= 90 
                            ? 'bg-success' 
                            : calculateOverallGrade(grades) >= 80
                            ? 'bg-primary'
                            : calculateOverallGrade(grades) >= 70
                            ? 'bg-warning'
                            : calculateOverallGrade(grades) >= 60
                            ? 'bg-warning text-dark'
                            : 'bg-danger'
                        }`}>
                          {calculateLetterGrade(calculateOverallGrade(grades))}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x fs-1 text-muted"></i>
              <h3 className="mt-3 fs-5 fw-medium">No grades found</h3>
              <p className="text-muted">
                {isTeacherOrAdmin
                  ? "No grades have been submitted for this course yet."
                  : "You don't have any grades for this course yet."}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-mortarboard fs-1 text-muted"></i>
          <h3 className="mt-3 fs-5 fw-medium">Select a course</h3>
          <p className="text-muted">Please select a course to view grades.</p>
        </div>
      )}
    </div>
  );
};

export default Grades;
