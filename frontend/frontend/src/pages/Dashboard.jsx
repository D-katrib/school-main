import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useFetch from '../hooks/useFetch';
import { 
  courseService, 
  assignmentService, 
  notificationService 
} from '../services/api';

// Sample data to use when API returns empty
const SAMPLE_COURSES = [
  {
    _id: 'c1',
    name: 'Mathematics',
    teacher: { firstName: 'John', lastName: 'Doe' }
  },
  {
    _id: 'c2',
    name: 'Physics',
    teacher: { firstName: 'Jane', lastName: 'Smith' }
  },
  {
    _id: 'c3',
    name: 'History',
    teacher: { firstName: 'Robert', lastName: 'Johnson' }
  },
  {
    _id: 'c4',
    name: 'Computer Science',
    teacher: { firstName: 'Sarah', lastName: 'Williams' }
  }
];

const SAMPLE_ASSIGNMENTS = [
  {
    _id: 'a1',
    title: 'Calculus Homework',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  },
  {
    _id: 'a2',
    title: 'Physics Lab Report',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  },
  {
    _id: 'a3',
    title: 'History Essay',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
  }
];

const SAMPLE_NOTIFICATIONS = [
  {
    _id: 'n1',
    title: 'New course available',
    message: 'A new course has been added to your schedule',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'n2',
    title: 'Assignment reminder',
    message: 'Don\'t forget to submit your assignment',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  }
];

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [combinedLoading, setCombinedLoading] = useState(false); // Start with false to show content immediately
  
  // Initialize with sample data first
  const [courses, setCourses] = useState(SAMPLE_COURSES);
  const [assignments, setAssignments] = useState(SAMPLE_ASSIGNMENTS);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const [upcomingAssignments, setUpcomingAssignments] = useState(SAMPLE_ASSIGNMENTS.length);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Fetch data using API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await courseService.getCourses();
        if (coursesResponse.data && coursesResponse.data.data && Array.isArray(coursesResponse.data.data) && coursesResponse.data.data.length > 0) {
          setCourses(coursesResponse.data.data);
        }
        
        // Fetch assignments
        const assignmentsResponse = await assignmentService.getAssignments();
        if (assignmentsResponse.data && assignmentsResponse.data.data && Array.isArray(assignmentsResponse.data.data) && assignmentsResponse.data.data.length > 0) {
          setAssignments(assignmentsResponse.data.data);
          
          // Calculate upcoming assignments
          const upcoming = assignmentsResponse.data.data.filter(a => {
            try {
              return a && a.dueDate && new Date(a.dueDate) > new Date();
            } catch (error) {
              console.error("Error checking assignment date:", error);
              return false;
            }
          }).length;
          
          setUpcomingAssignments(upcoming);
        }
        
        // Fetch notifications
        const notificationsResponse = await notificationService.getNotifications();
        if (notificationsResponse.data && notificationsResponse.data.data && Array.isArray(notificationsResponse.data.data) && notificationsResponse.data.data.length > 0) {
          setNotifications(notificationsResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setErrorMessage("Error loading data. Using sample data instead.");
      } finally {
        setCombinedLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  if (combinedLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-100 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 page-transition">
      {/* Welcome section */}
      <div className="card mb-4 border-0 bg-primary bg-gradient text-white shadow fade-in">
        <div className="card-body p-4">
          <h1 className="display-6 fw-bold">
            Welcome back, {currentUser?.firstName || 'User'}!
          </h1>
          <p className="lead opacity-75 mb-0">
            Here's what's happening in your school today.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="row g-4 mb-4 slide-in-up" style={{animationDelay: '0.1s'}}>
        {/* Courses section */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="card-title mb-0 fw-bold">My Courses</h5>
              <Link to="/courses" className="btn btn-sm btn-outline-primary">
                View all
              </Link>
            </div>
            <div className="card-body">
              {courses.length > 0 ? (
                <div className="list-group list-group-flush">
                  {courses.slice(0, 4).map((course, index) => (
                    <Link 
                      key={course._id || index} 
                      to={`/courses/${course._id}`}
                      className="list-group-item list-group-item-action d-flex align-items-center border-0 py-3 px-0"
                    >
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style={{width: '48px', height: '48px', flexShrink: 0}}>
                        {course.name?.substring(0, 2).toUpperCase() || 'CO'}
                      </div>
                      <div className="ms-3">
                        <h6 className="mb-0 fw-semibold">{course.name || 'Course'}</h6>
                        <p className="text-muted small mb-0">
                          {course.teacher?.firstName} {course.teacher?.lastName}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No courses available</p>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming assignments section */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="card-title mb-0 fw-bold">Upcoming Assignments</h5>
              <Link to="/assignments" className="btn btn-sm btn-outline-primary">
                View all
              </Link>
            </div>
            <div className="card-body">
              {assignments.length > 0 ? (
                <div className="list-group list-group-flush">
                  {assignments.slice(0, 5).map((assignment, index) => (
                    <Link 
                      key={assignment._id || index} 
                      to={`/assignments/${assignment._id}`}
                      className="list-group-item list-group-item-action d-flex align-items-center border-0 py-3 px-0"
                    >
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 text-warning" style={{width: '48px', height: '48px', flexShrink: 0}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="ms-3">
                        <h6 className="mb-0 fw-semibold">{assignment.title || 'Assignment'}</h6>
                        <p className="text-muted small mb-0">
                          Due: {assignment.dueDate ? formatDate(assignment.dueDate) : 'No date'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No upcoming assignments</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div className="col-md-6 col-lg-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0 fw-bold">Recent Notifications</h5>
            </div>
            <div className="card-body">
              {notifications.length > 0 ? (
                <div className="list-group list-group-flush">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div 
                      key={notification._id || index} 
                      className="list-group-item border-0 d-flex py-3 px-0"
                    >
                      <div className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success" style={{width: '48px', height: '48px', flexShrink: 0}}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div className="ms-3">
                        <h6 className="mb-1 fw-semibold">{notification.title || 'Notification'}</h6>
                        <p className="text-muted small mb-1">
                          {notification.message || 'No message'}
                        </p>
                        <small className="text-muted">
                          {notification.createdAt ? formatDate(notification.createdAt) : 'No date'}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">No notifications</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats section */}
      <div className="row g-4 slide-in-up" style={{animationDelay: '0.2s'}}>
        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h6 className="fw-semibold text-muted mb-1">Courses</h6>
                <h2 className="display-6 fw-bold mb-0">{courses.length}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-success">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h6 className="fw-semibold text-muted mb-1">Assignments</h6>
                <h2 className="display-6 fw-bold mb-0">{assignments.length}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-warning">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h6 className="fw-semibold text-muted mb-1">Upcoming Due</h6>
                <h2 className="display-6 fw-bold mb-0">
                  {upcomingAssignments}
                </h2>
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card shadow-sm border-0">
            <div className="card-body d-flex align-items-center p-4">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-info">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h6 className="fw-semibold text-muted mb-1">Notifications</h6>
                <h2 className="display-6 fw-bold mb-0">
                  {notifications.length}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
