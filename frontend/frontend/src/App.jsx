import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

// Import pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/AssignmentDetail';
import Attendance from './pages/Attendance';
import Grades from './pages/Grades';
import Profile from './pages/Profile';

// Import components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';


// Import contexts
import { AuthProvider } from './contexts/AuthContext';

function App() {
  // Force light theme
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    document.body.classList.add('bg-light');
  }, []);

  return (
    <div className="app-container bg-light">
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/new" element={<CourseDetail />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/assignments/new" element={<AssignmentDetail />} />
              <Route path="/assignments/:id" element={<AssignmentDetail />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
