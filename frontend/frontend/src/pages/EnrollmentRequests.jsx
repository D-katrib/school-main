import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MyEnrollmentRequests from '../components/MyEnrollmentRequests';

const EnrollmentRequests = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to view this page
  useEffect(() => {
    if (currentUser && currentUser.role !== 'student') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="fs-2 fw-bold mb-0">Course Enrollment Requests</h1>
      </div>

      <div className="row">
        <div className="col-12">
          <MyEnrollmentRequests />
        </div>
      </div>
    </div>
  );
};

export default EnrollmentRequests;
