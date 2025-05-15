import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CourseForm from '../components/CourseForm';

const AddCourse = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user has permission to add courses
  useEffect(() => {
    if (currentUser && !(currentUser.role === 'admin' || currentUser.role === 'teacher')) {
      navigate('/courses');
    }
  }, [currentUser, navigate]);

  return <CourseForm />;
};

export default AddCourse;
