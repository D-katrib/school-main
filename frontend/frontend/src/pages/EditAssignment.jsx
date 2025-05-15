import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assignmentService } from '../services/api';
import AssignmentForm from '../components/AssignmentForm';

const EditAssignment = () => {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoading(true);
        const response = await assignmentService.getAssignmentById(id);
        setAssignment(response.data);
      } catch (error) {
        console.error('Error fetching assignment:', error);
        setError('Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-50 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/assignments" className="btn btn-primary">
          Back to Assignments
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
        <Link to="/assignments" className="btn btn-outline-primary d-inline-flex align-items-center">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Assignments
        </Link>
      </div>
      
      <div className="row">
        <div className="col-lg-10 col-xl-8 mx-auto">
          {assignment && <AssignmentForm assignment={assignment} isEdit={true} />}
        </div>
      </div>
    </div>
  );
};

export default EditAssignment;
