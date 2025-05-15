import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseService, userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CourseForm = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scheduleItems, setScheduleItems] = useState([{ day: 'Monday', startTime: '08:00', endTime: '09:30', room: '' }]);
  const [teachers, setTeachers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    teacher: currentUser?.role === 'teacher' ? currentUser.id : '',
    grade: '',
    academicYear: '',
    semester: 'Fall',
    syllabus: ''
  });

  // Fetch teachers if user is admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const fetchTeachers = async () => {
        try {
          const response = await userService.getUsers();
          const teachersList = response.data.data.filter(user => user.role === 'teacher');
          setTeachers(teachersList);
        } catch (error) {
          console.error('Error fetching teachers:', error);
        }
      };
      
      fetchTeachers();
    }
  }, [currentUser]);

  useEffect(() => {
    // If editing, fetch the course data
    if (isEditing && id) {
      const fetchCourse = async () => {
        try {
          setLoading(true);
          const response = await courseService.getCourseById(id);
          const course = response.data.data;
          
          setFormData({
            name: course.name || '',
            code: course.code || '',
            description: course.description || '',
            teacher: course.teacher?._id || '',
            grade: course.grade || '',
            academicYear: course.academicYear || '',
            semester: course.semester || 'Fall',
            syllabus: course.syllabus || ''
          });

          // Set schedule items
          if (course.schedule && course.schedule.length > 0) {
            setScheduleItems(course.schedule);
          }
        } catch (error) {
          console.error('Error fetching course:', error);
          setError('Failed to load course data');
        } finally {
          setLoading(false);
        }
      };

      fetchCourse();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...scheduleItems];
    updatedSchedule[index] = {
      ...updatedSchedule[index],
      [field]: value
    };
    setScheduleItems(updatedSchedule);
  };

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, { day: 'Monday', startTime: '08:00', endTime: '09:30', room: '' }]);
  };

  const removeScheduleItem = (index) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(scheduleItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.name || !formData.code || !formData.description || !formData.teacher ||
          !formData.grade || !formData.academicYear || !formData.semester) {
        throw new Error('Please fill in all required fields');
      }

      // Validate schedule items
      for (const item of scheduleItems) {
        if (!item.day || !item.startTime || !item.endTime || !item.room) {
          throw new Error('Please fill in all schedule fields');
        }
      }

      const courseData = {
        ...formData,
        schedule: scheduleItems
      };

      let response;
      if (isEditing) {
        response = await courseService.updateCourse(id, courseData);
        setSuccess('Course updated successfully!');
      } else {
        response = await courseService.createCourse(courseData);
        setSuccess('Course created successfully!');
      }

      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate(`/courses/${response.data.data._id}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving course:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="mb-4">{isEditing ? 'Edit Course' : 'Add New Course'}</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Basic Information</h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Course Name*</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="code" className="form-label">Course Code*</label>
                <input
                  type="text"
                  className="form-control"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description*</label>
              <textarea
                className="form-control"
                id="description"
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="grade" className="form-label">Grade Level*</label>
                <input
                  type="number"
                  className="form-control"
                  id="grade"
                  name="grade"
                  min="1"
                  max="100"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="academicYear" className="form-label">Academic Year*</label>
                <input
                  type="text"
                  className="form-control"
                  id="academicYear"
                  name="academicYear"
                  placeholder="e.g. 2023-2024"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="semester" className="form-label">Semester*</label>
                <select
                  className="form-select"
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            {currentUser?.role === 'admin' && (
              <div className="mb-3">
                <label htmlFor="teacher" className="form-label">Teacher*</label>
                <select
                  className="form-select"
                  id="teacher"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="syllabus" className="form-label">Syllabus URL (optional)</label>
              <input
                type="url"
                className="form-control"
                id="syllabus"
                name="syllabus"
                value={formData.syllabus}
                onChange={handleChange}
                placeholder="https://example.com/syllabus.pdf"
              />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Schedule</h5>
            <button 
              type="button" 
              className="btn btn-sm btn-light" 
              onClick={addScheduleItem}
            >
              <i className="bi bi-plus-circle me-1"></i>
              Add Time Slot
            </button>
          </div>
          <div className="card-body">
            {scheduleItems.map((item, index) => (
              <div key={index} className="row mb-3 align-items-end">
                <div className="col-md-3">
                  <label className={index === 0 ? 'form-label' : 'visually-hidden'}>Day*</label>
                  <select
                    className="form-select"
                    value={item.day}
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
                <div className="col-md-2">
                  <label className={index === 0 ? 'form-label' : 'visually-hidden'}>Start Time*</label>
                  <input
                    type="time"
                    className="form-control"
                    value={item.startTime}
                    onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label className={index === 0 ? 'form-label' : 'visually-hidden'}>End Time*</label>
                  <input
                    type="time"
                    className="form-control"
                    value={item.endTime}
                    onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className={index === 0 ? 'form-label' : 'visually-hidden'}>Room*</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Room number/name"
                    value={item.room}
                    onChange={(e) => handleScheduleChange(index, 'room', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-1">
                  {scheduleItems.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => removeScheduleItem(index)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex gap-2">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => navigate('/courses')}
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
                Saving...
              </>
            ) : (
              isEditing ? 'Update Course' : 'Create Course'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
