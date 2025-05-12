import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  AcademicCapIcon, 
  BookOpenIcon, 
  ClipboardDocumentListIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Layout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 992);
  const [notifications, setNotifications] = useState([]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    if (window.innerWidth < 992) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Adjust sidebar based on window resize
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: AcademicCapIcon },
    { name: 'Courses', href: '/courses', icon: BookOpenIcon },
    { name: 'Assignments', href: '/assignments', icon: ClipboardDocumentListIcon },
    { name: 'Attendance', href: '/attendance', icon: UserGroupIcon },
    { name: 'Grades', href: '/grades', icon: ChartBarIcon },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none" 
          style={{ zIndex: 1030 }}
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`sidebar bg-white shadow ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        style={{ 
          zIndex: 1040,
          width: '280px',
          transition: 'left 0.3s ease-in-out',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: sidebarOpen ? '0' : '-280px'
        }}
      >
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <h1 className="fs-4 fw-bold text-primary mb-0">MySchool</h1>
          <button 
            className="btn btn-sm d-lg-none"
            onClick={toggleSidebar}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-3 overflow-auto" style={{ height: 'calc(100% - 60px)' }}>
          {/* User info */}
          <div className="d-flex align-items-center mb-4">
            <div className="me-3">
              <UserCircleIcon className="w-10 h-10 text-secondary" style={{ width: '40px', height: '40px' }} />
            </div>
            <div>
              <p className="fw-medium mb-0">
                {currentUser?.firstName || 'User'} {currentUser?.lastName || ''}
              </p>
              <p className="text-muted small text-capitalize mb-0">
                {currentUser?.role || 'Student'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mb-4">
            <div className="list-group list-group-flush">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `list-group-item list-group-item-action d-flex align-items-center border-0 py-2 px-3 ${isActive ? 'active bg-primary bg-opacity-10 text-primary' : 'text-secondary'}`
                  }
                >
                  <item.icon className="flex-shrink-0 me-3" style={{ width: '1.25rem', height: '1.25rem' }} />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Logout button */}
          <div className="pt-3 mt-3 border-top">
            <button
              onClick={handleLogout}
              className="btn btn-outline-danger d-flex align-items-center w-100"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="me-2" 
                style={{ width: '1.25rem', height: '1.25rem' }}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="content-wrapper d-flex flex-column flex-grow-1">
        {/* Top navigation */}
        <header className="sticky-top bg-white shadow-sm">
          <nav className="navbar navbar-expand navbar-light bg-white py-2 px-3">
            <button 
              className="btn btn-sm d-lg-none me-2"
              onClick={toggleSidebar}
              aria-label="Toggle navigation"
            >
              <Bars3Icon style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>

            <div className="ms-auto d-flex align-items-center">
              <div className="position-relative me-3">
                <button 
                  className="btn btn-sm position-relative"
                  onClick={() => navigate('/profile')}
                  aria-label="Notifications"
                >
                  <BellIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger rounded-circle">
                    <span className="visually-hidden">New alerts</span>
                  </span>
                </button>
              </div>
              <NavLink 
                to="/profile" 
                className="text-decoration-none"
                aria-label="Profile"
              >
                <UserCircleIcon style={{ width: '2rem', height: '2rem' }} className="text-secondary" />
              </NavLink>
            </div>
          </nav>
        </header>

        {/* Page content */}
        <main className="flex-grow-1 p-3 overflow-auto bg-light">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white text-center p-3 border-top small text-muted">
          <p className="mb-0">© {new Date().getFullYear()} MySchool. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
