import { useState } from 'react';
import { enrollmentRequestService } from '../services/api';

const CourseEnrollmentRequest = ({ courseId, courseName, onRequestSent }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestEnrollment = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);

      // Confirm before sending the request
      if (window.confirm(`Are you sure you want to request enrollment in ${courseName}?`)) {
        await enrollmentRequestService.createRequest(courseId);
        
        setSuccess(true);
        
        // Notify parent component
        if (onRequestSent) {
          onRequestSent();
        }
      } else {
        // User canceled the enrollment request
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error requesting enrollment:', error);
      
      // Handle specific error messages in a user-friendly way
      if (error.response?.data?.message) {
        // Backend error messages
        const message = error.response.data.message;
        
        if (message.includes('already enrolled')) {
          setError('You are already enrolled in this course.');
        } else if (message.includes('pending enrollment request')) {
          setError('You already have a pending enrollment request for this course. Please wait for the teacher to respond.');
        } else if (message.includes('already been approved')) {
          setError('Your enrollment request for this course has already been approved. You should be enrolled soon.');
        } else {
          setError(message);
        }
      } else {
        // Generic error handling
        setError(error.message || 'Failed to send enrollment request. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="course-enrollment-request">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success ? (
        <div className="alert alert-success" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          Your enrollment request for <strong>{courseName}</strong> has been sent successfully. You will be notified once it's processed.
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Interested in this course?</h5>
            <p className="card-text">You are not currently enrolled in <strong>{courseName}</strong>. Request enrollment to join this course.</p>
            <button
              className="btn btn-primary"
              onClick={handleRequestEnrollment}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending Request...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus me-2"></i>
                  Request Enrollment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollmentRequest;
