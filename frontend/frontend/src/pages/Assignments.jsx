import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { assignmentService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SkeletonLoader from "../components/SkeletonLoader";

const Assignments = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await assignmentService.getAssignments();
        // Convert object to array if needed
        const assignmentsArray = Array.isArray(response.data) ? response.data : Object.values(response.data);
        setAssignments(assignmentsArray);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setError('Failed to load assignments');
        setAssignments([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if assignment is past due
  const isPastDue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  // Filter, sort and search assignments
  const filteredAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) return [];
    
    let filtered = [...assignments];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        assignment => 
          assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (assignment.description && assignment.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (assignment.course?.name && assignment.course.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (filter === 'upcoming') {
      filtered = filtered.filter(assignment => !isPastDue(assignment.dueDate) && !assignment.submitted);
    } else if (filter === 'pastDue') {
      filtered = filtered.filter(assignment => isPastDue(assignment.dueDate) && !assignment.submitted);
    } else if (filter === 'submitted') {
      filtered = filtered.filter(assignment => assignment.submitted);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'dueDate') {
        comparison = new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'course') {
        const courseA = a.course?.name || '';
        const courseB = b.course?.name || '';
        comparison = courseA.localeCompare(courseB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [assignments, searchTerm, sortBy, sortOrder, filter]);

  // Group assignments by status for visual organization
  const groupedAssignments = useMemo(() => {
    if (!Array.isArray(filteredAssignments)) return { upcoming: [], submitted: [], pastDue: [] };
    if (filter !== 'all') return { filtered: filteredAssignments };
    
    return {
      upcoming: filteredAssignments.filter(a => !isPastDue(a.dueDate) && !a.submitted),
      submitted: filteredAssignments.filter(a => a.submitted),
      pastDue: filteredAssignments.filter(a => isPastDue(a.dueDate) && !a.submitted)
    };
  }, [filteredAssignments, filter]);

  // Skeleton loader for assignments
  const SkeletonLoader = () => (
    <div className="d-flex flex-column gap-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ opacity: 0.7 }}>
          <div className="card-body">
            <div className="d-flex flex-column flex-md-row justify-content-between">
              <div className="col-md-8">
                <div className="bg-secondary bg-opacity-25 rounded h-4 w-75 mb-3" style={{ height: "24px" }}></div>
                <div className="bg-secondary bg-opacity-25 rounded w-25 mb-2" style={{ height: "16px" }}></div>
                <div className="bg-secondary bg-opacity-25 rounded w-100 mt-3" style={{ height: "16px" }}></div>
              </div>
              <div className="col-md-3 mt-3 mt-md-0 d-flex flex-column align-items-start align-items-md-end">
                <div className="bg-secondary bg-opacity-25 rounded-pill w-50" style={{ height: "24px" }}></div>
                <div className="bg-secondary bg-opacity-25 rounded w-75 mt-2" style={{ height: "16px" }}></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAssignmentList = (assignmentList, sectionTitle = null) => {
    if (!assignmentList || assignmentList.length === 0) {
      return null;
    }

    return (
      <div className="mb-4" key={sectionTitle || 'default'}>
        {sectionTitle && (
          <h2 className="fs-4 fw-semibold mb-3 border-bottom pb-2">{sectionTitle}</h2>
        )}
        <div className="d-flex flex-column gap-3">
          {assignmentList.map((assignment, index) => (
            <Link
              key={assignment._id || `assignment-${index}-${assignment.title || 'untitled'}-${assignment.dueDate || 'no-date'}`}
              to={`/assignments/${assignment._id}`}
              className="text-decoration-none"
            >
              <div className="card hover-shadow border-start border-4 border-primary-subtle">
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row justify-content-between">
                    <div>
                      <h2 className="fs-5 fw-semibold">{assignment.title || 'Untitled Assignment'}</h2>
                      <p className="text-muted small mb-1">
                        Course: {assignment.course?.name || 'Unknown Course'}
                      </p>
                      <p className="text-muted small">
                        {assignment.description ? (
                          <span className="text-truncate d-inline-block" style={{maxWidth: "100%", maxHeight: "3em", overflow: "hidden"}}>
                            {assignment.description}
                          </span>
                        ) : (
                          'No description available'
                        )}
                      </p>
                    </div>
                    <div className="mt-3 mt-md-0 d-flex flex-column align-items-start align-items-md-end">
                      <span className={`badge ${
                        assignment.submitted
                          ? 'bg-primary'
                          : isPastDue(assignment.dueDate)
                            ? 'bg-danger'
                            : 'bg-success'
                      }`}>
                        {assignment.submitted 
                          ? 'Submitted' 
                          : isPastDue(assignment.dueDate) 
                            ? 'Past Due' 
                            : 'Active'
                        }
                      </span>
                      <p className="text-muted small mt-2">
                        Due: {formatDate(assignment.dueDate)}
                      </p>
                      {assignment.points && (
                        <p className="text-muted small mt-1">
                          Points: {assignment.points}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fs-2 fw-bold">Assignments</h1>
        </div>
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <h1 className="fs-2 fw-bold mb-0">Assignments</h1>
        {currentUser?.role === 'admin' || currentUser?.role === 'teacher' ? (
          <Link to="/assignments/new" className="btn btn-primary">
            <i className="bi bi-plus me-1"></i>
            Create Assignment
          </Link>
        ) : null}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="mb-4">
        {/* Search and Filter Controls */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="d-flex flex-wrap gap-2">
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter assignments"
              >
                <option value="all">All Assignments</option>
                <option value="upcoming">Upcoming</option>
                <option value="submitted">Submitted</option>
                <option value="pastDue">Past Due</option>
              </select>
              
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort assignments"
              >
                <option value="dueDate">Due Date</option>
                <option value="title">Title</option>
                <option value="course">Course</option>
              </select>
              
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                aria-label="Toggle sort order"
              >
                <i className={`bi bi-sort-${sortOrder === 'asc' ? 'down' : 'up'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="mb-4">
          {/* If filtered view is selected, show only filtered results */}
          {filter !== 'all' ? (
            <div className="mb-3">
              <p className="text-muted small">
                Showing {filteredAssignments.length} {filter === 'upcoming' ? 'upcoming' : filter === 'submitted' ? 'submitted' : 'past due'} assignments
              </p>
              {renderAssignmentList(filteredAssignments)}
            </div>
          ) : (
            /* Otherwise show grouped by status */
            <>
              {groupedAssignments.upcoming.length > 0 && (
                renderAssignmentList(groupedAssignments.upcoming, 'Upcoming Assignments')
              )}
              
              {groupedAssignments.submitted.length > 0 && (
                renderAssignmentList(groupedAssignments.submitted, 'Submitted Assignments')
              )}
              
              {groupedAssignments.pastDue.length > 0 && (
                renderAssignmentList(groupedAssignments.pastDue, 'Past Due Assignments')
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-5 bg-light rounded">
          <i className="bi bi-file-earmark-text fs-1 text-muted"></i>
          <h3 className="mt-3 fs-5 fw-medium">No assignments found</h3>
          <p className="text-muted">
            {searchTerm ? 'No assignments match your search criteria.' : 
              currentUser?.role === 'admin' || currentUser?.role === 'teacher'
                ? 'Get started by creating a new assignment.'
                : 'There are no assignments available at the moment.'}
          </p>
          {currentUser?.role === 'admin' || currentUser?.role === 'teacher' ? (
            <div className="mt-3">
              <Link to="/assignments/new" className="btn btn-primary">
                <i className="bi bi-plus me-1"></i>
                Create Assignment
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Assignments;