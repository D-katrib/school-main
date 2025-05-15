import { Link } from 'react-router-dom';
import AssignmentForm from '../components/AssignmentForm';

const AddAssignment = () => {
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
          <AssignmentForm />
        </div>
      </div>
    </div>
  );
};

export default AddAssignment;
