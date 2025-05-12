import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, redirectPath = '/login' }) => {
  const { currentUser, loading, authenticated } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!authenticated || !currentUser) {
    return <Navigate to={redirectPath} replace state={{ from: window.location.pathname }} />;
  }

  // Render children or outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
