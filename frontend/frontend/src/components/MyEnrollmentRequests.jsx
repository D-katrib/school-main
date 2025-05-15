import { useState, useEffect } from 'react';
import { enrollmentRequestService } from '../services/api';
import { Link } from 'react-router-dom';

const MyEnrollmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState(null);

  // Fetch enrollment requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await enrollmentRequestService.getMyRequests();
        setRequests(response.data.data);
      } catch (error) {
        console.error('Error fetching enrollment requests:', error);
        setError('Failed to load your enrollment requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Cancel enrollment request
  const handleCancelRequest = async (requestId) => {
    // Find the request to get course name for confirmation
    const request = requests.find(req => req._id === requestId);
    const courseName = request?.course?.name || 'this course';
    
    // Ask for confirmation before canceling
    if (!window.confirm(`Are you sure you want to cancel your enrollment request for ${courseName}?`)) {
      return; // User canceled the action
    }
    
    try {
      setCancelingId(requestId);
      setError('');

      await enrollmentRequestService.cancelRequest(requestId);
      
      // Update the local state
      setRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'alert alert-info alert-dismissible fade show';
      successMessage.innerHTML = `
        <strong>Canceled:</strong> Your enrollment request for ${courseName} has been canceled.
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      
      // Find a good place to show the message
      const container = document.querySelector('.my-enrollment-requests');
      if (container) {
        // Insert after the heading
        const heading = container.querySelector('h2');
        if (heading) {
          heading.insertAdjacentElement('afterend', successMessage);
        } else {
          container.prepend(successMessage);
        }
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          successMessage.classList.remove('show');
          setTimeout(() => successMessage.remove(), 150);
        }, 5000);
      }
    } catch (error) {
      console.error('Error canceling request:', error);
      setError('Failed to cancel enrollment request: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      setCancelingId(null);
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

  return (
    <div className="my-enrollment-requests">
      <h2 className="fs-4 mb-4">My Enrollment Requests</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {requests.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Course</th>
                <th>Teacher</th>
                <th>Request Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(request => (
                <tr key={request._id}>
                  <td>
                    <Link to={`/courses/${request.course._id}`} className="text-decoration-none">
                      <div>
                        <p className="mb-0 fw-medium">{request.course.name}</p>
                        <p className="mb-0 small text-muted">{request.course.code}</p>
                      </div>
                    </Link>
                  </td>
                  <td>
                    {request.course.teacher?.firstName} {request.course.teacher?.lastName}
                  </td>
                  <td>
                    {new Date(request.requestDate).toLocaleDateString()}
                  </td>
                  <td>
                    {request.status === 'pending' ? (
                      <span className="badge bg-warning">Pending</span>
                    ) : request.status === 'approved' ? (
                      <span className="badge bg-success">Approved</span>
                    ) : (
                      <span className="badge bg-danger">Rejected</span>
                    )}
                  </td>
                  <td>
                    {request.status === 'pending' && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleCancelRequest(request._id)}
                        disabled={cancelingId === request._id}
                      >
                        {cancelingId === request._id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <>
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 bg-light rounded">
          <i className="bi bi-inbox fs-1 text-muted"></i>
          <p className="text-muted mt-2">You don't have any enrollment requests</p>
          <Link to="/courses" className="btn btn-primary mt-2">
            <i className="bi bi-journal-text me-2"></i>
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyEnrollmentRequests;
