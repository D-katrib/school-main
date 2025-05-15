import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { assignmentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SubmissionDetail = () => {
  const { assignmentId, submissionId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
    publishGrade: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First get the assignment details
        const assignmentResponse = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentResponse.data.data);
        
        // Then get all submissions for this assignment
        const submissionsResponse = await assignmentService.getSubmissions(assignmentId);
        
        // Find the specific submission
        const foundSubmission = submissionsResponse.data.data.find(
          sub => sub._id === submissionId
        );
        
        if (!foundSubmission) {
          throw new Error('Submission not found');
        }
        
        setSubmission(foundSubmission);
        
        // Pre-fill grade data if already graded
        if (foundSubmission.status === 'graded') {
          setGradeData({
            score: foundSubmission.score || '',
            feedback: foundSubmission.feedback || '',
            publishGrade: true
          });
        }
      } catch (error) {
        console.error('Error fetching submission details:', error);
        setError('Failed to load submission details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, submissionId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGradeData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    
    // Validate score
    const score = parseFloat(gradeData.score);
    if (isNaN(score) || score < 0 || score > (assignment?.totalPoints || 100)) {
      setError(`Score must be a number between 0 and ${assignment?.totalPoints || 100}`);
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      await assignmentService.gradeSubmission(submissionId, {
        score,
        feedback: gradeData.feedback,
        publishGrade: gradeData.publishGrade
      });
      
      alert('Submission graded successfully!');
      navigate(`/assignments/${assignmentId}`);
    } catch (error) {
      console.error('Error grading submission:', error);
      setError('Failed to grade submission: ' + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to={`/assignments/${assignmentId}`} className="btn btn-primary">
          Back to Assignment
        </Link>
      </div>
    );
  }

  if (!submission || !assignment) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning" role="alert">
          Submission not found or you don't have permission to view it.
        </div>
        <Link to="/assignments" className="btn btn-primary">
          Back to Assignments
        </Link>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const canGrade = isAdmin || isTeacher;

  return (
    <div className="container-fluid py-4 page-transition">
      <div className="d-flex justify-content-between align-items-center mb-4 fade-in">
        <Link to={`/assignments/${assignmentId}`} className="btn btn-outline-primary d-inline-flex align-items-center">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Assignment
        </Link>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h1 className="fs-4 fw-bold mb-0">Student Submission</h1>
                <span className="badge bg-primary">{submission.status === 'graded' ? 'Graded' : 'Submitted'}</span>
              </div>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h2 className="fs-5 fw-semibold mb-3">Assignment: {assignment.title}</h2>
                <p className="text-muted mb-2">
                  <strong>Student:</strong> {submission.student?.firstName} {submission.student?.lastName}
                </p>
                <p className="text-muted mb-2">
                  <strong>Submitted:</strong> {formatDate(submission.submittedAt)}
                </p>
                <p className="text-muted mb-2">
                  <strong>Status:</strong> {submission.isLate ? 'Late Submission' : 'On Time'}
                </p>
                {submission.status === 'graded' && (
                  <p className="text-muted mb-0">
                    <strong>Score:</strong> {submission.score} / {assignment.totalPoints}
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="fs-5 fw-semibold mb-3">Submission Content</h3>
                <div className="p-3 bg-light rounded">
                  <p className="whitespace-pre-line mb-0">{submission.content || 'No text content provided.'}</p>
                </div>
              </div>
              
              {submission.attachments && submission.attachments.length > 0 && (
                <div className="mb-4">
                  <h3 className="fs-5 fw-semibold mb-3">Attachments</h3>
                  <ul className="list-group">
                    {submission.attachments.map((attachment, index) => (
                      <li key={index} className="list-group-item d-flex align-items-center">
                        <i className="bi bi-file-earmark me-2"></i>
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
              
              {submission.status === 'graded' && submission.feedback && (
                <div className="mb-4">
                  <h3 className="fs-5 fw-semibold mb-3">Teacher Feedback</h3>
                  <div className="p-3 bg-light rounded">
                    <p className="whitespace-pre-line mb-0">{submission.feedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {canGrade && (
          <div className="col-lg-4">
            <div className="card shadow-sm">
              <div className="card-header bg-white py-3">
                <h2 className="fs-4 fw-bold mb-0">Grade Submission</h2>
              </div>
              <div className="card-body">
                {error && <div className="alert alert-danger mb-3">{error}</div>}
                
                <form onSubmit={handleSubmitGrade}>
                  <div className="mb-3">
                    <label htmlFor="score" className="form-label fw-medium">Score</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        id="score"
                        name="score"
                        value={gradeData.score}
                        onChange={handleInputChange}
                        min="0"
                        max={assignment.totalPoints}
                        step="0.1"
                        required
                      />
                      <span className="input-group-text">/ {assignment.totalPoints}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="feedback" className="form-label fw-medium">Feedback</label>
                    <textarea
                      className="form-control"
                      id="feedback"
                      name="feedback"
                      rows="5"
                      value={gradeData.feedback}
                      onChange={handleInputChange}
                      placeholder="Provide feedback to the student..."
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="publishGrade"
                        name="publishGrade"
                        checked={gradeData.publishGrade}
                        onChange={handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="publishGrade">
                        Publish grade to student immediately
                      </label>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Save Grade'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionDetail;
