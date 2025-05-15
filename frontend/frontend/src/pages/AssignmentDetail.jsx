import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { assignmentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AssignmentDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    const fetchAssignment = async () => {
      // Don't fetch if we're creating a new assignment
      if (id === 'new') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await assignmentService.getAssignmentById(id);
        // Correctly access the data from the API response structure
        setAssignment(response.data.data);
        console.log('Assignment details:', response.data.data);
      } catch (error) {
        console.error('Error fetching assignment:', error);
        setError('Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        const response = await assignmentService.deleteAssignment(id);
        console.log('Delete response:', response);
        // Show success message before navigating
        alert('Assignment deleted successfully');
        navigate('/assignments');
      } catch (error) {
        console.error('Error deleting assignment:', error);
        setError('Failed to delete assignment: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Validate file size (max 5MB per file)
    const oversizedFiles = selectedFiles.filter(file => file.size > 5 * 1024 * 1024);
    
    if (oversizedFiles.length > 0) {
      setFileError('Some files exceed the 5MB size limit');
      return;
    }
    
    setSubmissionFiles(selectedFiles);
    setFileError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submission.trim() && submissionFiles.length === 0) {
      setError('Please provide either a text answer or upload files');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Create FormData for submission with files
      if (submissionFiles.length > 0) {
        const formData = new FormData();
        formData.append('content', submission);
        
        // Append files
        submissionFiles.forEach(file => {
          formData.append('files', file);
        });
        
        await assignmentService.submitAssignment(id, formData, true);
      } else {
        // Text-only submission
        await assignmentService.submitAssignment(id, { content: submission });
      }
      
      // Show success message
      alert('Assignment submitted successfully!');
      
      // Refresh assignment data to show submission
      const response = await assignmentService.getAssignmentById(id);
      setAssignment(response.data.data);
      setSubmission('');
      setSubmissionFiles([]);
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setError('Failed to submit assignment: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if assignment is past due
  const isPastDue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

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
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-5 fade-in">
        <h3 className="fs-4 fw-medium mb-2">Assignment not found</h3>
        <p className="text-muted mb-4">The assignment you're looking for doesn't exist or has been removed.</p>
        <div>
          <Link to="/assignments" className="btn btn-primary">
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  // Simplified role checks
  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  
  // Always allow admin to edit/delete, allow teacher if they teach the course
  const canEdit = isAdmin || (isTeacher && currentUser?._id);
  const canSubmit = isStudent && !isPastDue(assignment.dueDate) && !assignment.submitted;

  return (
    <div className="container-fluid py-4 page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
        <Link to="/assignments" className="btn btn-outline-primary d-inline-flex align-items-center">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Assignments
        </Link>
        {(isAdmin || isTeacher) && (
          <div className="d-flex gap-2">
            <Link to={`/assignments/edit/${id}`} className="btn btn-outline-primary">
              <i className="bi bi-pencil me-1"></i> Edit
            </Link>
            <button className="btn btn-danger" onClick={handleDelete}>
              <i className="bi bi-trash me-1"></i> Delete
            </button>
          </div>
        )}
      </div>

      <div className="card shadow-sm mb-4 slide-in-up" style={{animationDelay: '0.1s'}}>
        <div className="card-body p-4">
          <div className="row">
            <div className="col-md-8 mb-4 mb-md-0">
              <h1 className="fs-2 fw-bold mb-1">{assignment.title}</h1>
              <p className="text-muted mb-4">
                Course: {assignment.course?.name || 'Unknown Course'}
              </p>

              <div className="mb-4">
                <h2 className="fs-4 fw-semibold mb-3">Description</h2>
                <div className="">
                  <p className="whitespace-pre-line">{assignment.description || 'No description available'}</p>
                </div>
              </div>

              {assignment.attachments && assignment.attachments.length > 0 && (
                <div className="mb-4">
                  <h2 className="fs-4 fw-semibold mb-3">Attachments</h2>
                  <ul className="list-group">
                    {assignment.attachments.map((attachment, index) => (
                      <li key={index} className="list-group-item d-flex align-items-center border-0 ps-0">
                        <i className="bi bi-file-earmark-text text-primary me-2 fs-5"></i>
                        <a 
                          href={attachment.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          {attachment.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isStudent && (
                <div className="mt-4">
                  <h2 className="fs-4 fw-semibold mb-3">Submit Assignment</h2>
                  {assignment.submitted ? (
                    <div className="alert alert-success">
                      <p className="fw-medium mb-1">You have already submitted this assignment.</p>
                      <p className="mb-0">Submitted on: {formatDate(assignment.submittedAt)}</p>
                    </div>
                  ) : isPastDue(assignment.dueDate) ? (
                    <div className="alert alert-danger">
                      <p className="fw-medium mb-0">This assignment is past due. Submissions are no longer accepted.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      {error && <div className="alert alert-danger mb-3">{error}</div>}
                      
                      <div className="mb-3">
                        <label htmlFor="submission" className="form-label fw-medium">
                          Your Answer (Optional if uploading files)
                        </label>
                        <textarea
                          id="submission"
                          rows="6"
                          className="form-control"
                          value={submission}
                          onChange={(e) => setSubmission(e.target.value)}
                          placeholder="Type your answer here..."
                        ></textarea>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="submissionFiles" className="form-label fw-medium">
                          Upload Files (Optional)
                        </label>
                        <input
                          type="file"
                          className={`form-control ${fileError ? 'is-invalid' : ''}`}
                          id="submissionFiles"
                          onChange={handleFileChange}
                          multiple
                        />
                        {fileError && <div className="invalid-feedback">{fileError}</div>}
                        <div className="form-text">
                          You can upload multiple files (max 5MB each). Accepted file types: documents, images, PDFs.
                        </div>
                        
                        {submissionFiles.length > 0 && (
                          <div className="mt-2">
                            <p className="mb-1 fw-medium">Selected files:</p>
                            <ul className="list-group">
                              {submissionFiles.map((file, index) => (
                                <li key={index} className="list-group-item py-2">
                                  <div className="d-flex align-items-center">
                                    <i className="bi bi-file-earmark me-2"></i>
                                    <span>{file.name}</span>
                                    <span className="text-muted ms-2">({(file.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="submit"
                        disabled={submitting || (submission.trim() === '' && submissionFiles.length === 0)}
                        className="btn btn-primary"
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : 'Submit Assignment'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="col-md-4">
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h2 className="fs-4 fw-semibold mb-3">Assignment Details</h2>
                  <div className="mb-3">
                    <p className="text-muted mb-1">Due Date</p>
                    <p className={`fw-medium ${
                      isPastDue(assignment.dueDate)
                        ? 'text-danger'
                        : 'text-success'
                    }`}>
                      {formatDate(assignment.dueDate)}
                      {isPastDue(assignment.dueDate) ? ' (Past Due)' : ''}
                    </p>
                  </div>
                  <div className="mb-3">
                    <p className="text-muted mb-1">Points</p>
                    <p className="fw-medium">{assignment.totalPoints || 'Not specified'}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-muted mb-1">Created By</p>
                    <p className="fw-medium">
                      {assignment.createdBy?.firstName} {assignment.createdBy?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Created On</p>
                    <p className="fw-medium">{formatDate(assignment.createdAt)}</p>
                  </div>
                </div>
              </div>

              {(isTeacher || isAdmin) && assignment.submissions && assignment.submissions.length > 0 && (
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h2 className="fs-4 fw-semibold mb-3">Submissions</h2>
                    <div className="list-group">
                      {assignment.submissions.map((sub) => (
                        <div key={sub._id} className="list-group-item border mb-2 rounded">
                          <div className="d-flex align-items-center mb-2">
                            <div className="rounded-circle bg-light d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                              <span className="fw-medium">{sub.student?.firstName.charAt(0)}{sub.student?.lastName.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="fw-medium mb-0">
                                {sub.student?.firstName} {sub.student?.lastName}
                              </p>
                              <p className="text-muted small mb-0">
                                Submitted: {formatDate(sub.submittedAt)}
                              </p>
                            </div>
                          </div>
                          <Link
                            to={`/assignments/${id}/submissions/${sub._id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            View Submission
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
