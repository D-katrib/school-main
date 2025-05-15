import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CourseForm from '../components/CourseForm';

const EditCourse = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  // Check if user has permission to edit courses
  useEffect(() => {
    if (currentUser && !(currentUser.role === 'admin' || currentUser.role === 'teacher')) {
      navigate('/courses');
    }
  }, [currentUser, navigate]);

  return <CourseForm isEditing={true} />;
};

export default EditCourse;
