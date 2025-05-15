import { useState, useEffect } from 'react';
import { courseService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const EnrollmentRequestManager = ({ courseId, onRequestProcessed }) => {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // Fetch enrollment requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await courseService.getEnrollmentRequests(courseId);
        setRequests(response.data.data);
      } catch (error) {
        console.error('Error fetching enrollment requests:', error);
        setError('Failed to load enrollment requests');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchRequests();
    }
  }, [courseId]);

  // Process enrollment request (approve or reject)
  const handleProcessRequest = async (requestId, status) => {
    try {
      setProcessingId(requestId);
      setError('');

      // Get the request details for the success message
      const request = requests.find(req => req._id === requestId);
      const studentName = request ? `${request.student.firstName} ${request.student.lastName}` : 'Student';
      
      // Process the request
      await courseService.processEnrollmentRequest(requestId, status);
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = `alert alert-${status === 'approved' ? 'success' : 'info'} alert-dismissible fade show`;
      successMessage.innerHTML = `
        <strong>${status === 'approved' ? 'Approved' : 'Rejected'}</strong>: ${studentName}'s enrollment request has been ${status === 'approved' ? 'approved' : 'rejected'}.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      // Find a good place to show the message
      const container = document.querySelector('.enrollment-request-manager');
      if (container) {
        container.prepend(successMessage);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          successMessage.classList.remove('show');
          setTimeout(() => successMessage.remove(), 150);
        }, 5000);
      }
      
      // Update the local state
      setRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Notify parent component to refresh course data
      if (onRequestProcessed) {
        onRequestProcessed();
      }
    } catch (error) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} request:`, error);
      setError(`Failed to ${status === 'approved' ? 'approve' : 'reject'} enrollment request: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="d-flex justify-content-center my-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Filter to show only pending requests
  const pendingRequests = requests.filter(req => req.status === 'pending');

  return (
    <div className="enrollment-request-manager">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Enrollment Requests</h5>
        </div>
        <div className="card-body">
          {pendingRequests.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Request Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(request => (
                    <tr key={request._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle me-2" 
                               style={{ width: "32px", height: "32px", fontSize: "0.8rem" }}>
                            {request.student.firstName?.charAt(0)}{request.student.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="mb-0 fw-medium">{request.student.firstName} {request.student.lastName}</p>
                            <p className="mb-0 small text-muted">{request.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        {new Date(request.requestDate).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleProcessRequest(request._id, 'approved')}
                            disabled={processingId === request._id}
                          >
                            {processingId === request._id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <>
                                <i className="bi bi-check-circle me-1"></i>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleProcessRequest(request._id, 'rejected')}
                            disabled={processingId === request._id}
                          >
                            {processingId === request._id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <>
                                <i className="bi bi-x-circle me-1"></i>
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="text-muted mt-2">No pending enrollment requests</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnrollmentRequestManager;
