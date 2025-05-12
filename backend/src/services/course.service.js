const Course = require('../models/course.model');
const User = require('../models/user.model');

/**
 * Get all courses with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @param {Object} user - Current user object
 * @returns {Object} Courses and pagination data
 */
exports.getCourses = async (queryParams, user) => {
  // Build query
  let query;
  
  // Copy queryParams
  const reqQuery = { ...queryParams };
  
  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit'];
  
  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach(param => delete reqQuery[param]);
  
  // Create query string
  let queryStr = JSON.stringify(reqQuery);
  
  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
  
  // Finding resource
  query = Course.find(JSON.parse(queryStr));
  
  // Role-based filtering
  if (user.role === 'student') {
    // Students can only see courses they're enrolled in
    query = query.find({ students: user.id });
  } else if (user.role === 'teacher') {
    // Teachers can only see courses they teach
    query = query.find({ teacher: user.id });
  } else if (user.role === 'parent') {
    // Parents can see courses their children are enrolled in
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    query = query.find({ students: { $in: studentIds } });
  }
  
  // Select Fields
  if (queryParams.select) {
    const fields = queryParams.select.split(',').join(' ');
    query = query.select(fields);
  }
  
  // Sort
  if (queryParams.sort) {
    const sortBy = queryParams.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }
  
  // Get total count for pagination
  const total = await Course.countDocuments(query.getQuery());
  
  // Pagination
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  query = query.skip(startIndex).limit(limit);
  
  // Populate teacher
  query = query.populate({
    path: 'teacher',
    select: 'firstName lastName email'
  });
  
  // Executing query
  const courses = await query;
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  return {
    count: courses.length,
    pagination,
    data: courses
  };
};

/**
 * Get course by ID
 * @param {string} courseId - Course ID
 * @param {Object} user - Current user object
 * @returns {Object} Course object
 */
exports.getCourseById = async (courseId, user) => {
  const course = await Course.findById(courseId)
    .populate({
      path: 'teacher',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'students',
      select: 'firstName lastName email'
    });
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if user has access to this course
  if (user.role === 'student' && !course.students.some(student => student._id.toString() === user.id)) {
    const error = new Error('Not authorized to access this course');
    error.statusCode = 403;
    throw error;
  } else if (user.role === 'teacher' && course.teacher._id.toString() !== user.id) {
    const error = new Error('Not authorized to access this course');
    error.statusCode = 403;
    throw error;
  } else if (user.role === 'parent') {
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    const isParentOfStudent = course.students.some(student => 
      studentIds.includes(student._id.toString())
    );
    
    if (!isParentOfStudent) {
      const error = new Error('Not authorized to access this course');
      error.statusCode = 403;
      throw error;
    }
  }
  
  return course;
};

/**
 * Create new course
 * @param {Object} courseData - Course data
 * @param {Object} user - Current user object
 * @returns {Object} Created course
 */
exports.createCourse = async (courseData, user) => {
  // If teacher is creating course, set teacher to current user
  if (user.role === 'teacher') {
    courseData.teacher = user.id;
  }
  
  const course = await Course.create(courseData);
  return course;
};

/**
 * Update course
 * @param {string} courseId - Course ID
 * @param {Object} courseData - Course data to update
 * @param {Object} user - Current user object
 * @returns {Object} Updated course
 */
exports.updateCourse = async (courseId, courseData, user) => {
  let course = await Course.findById(courseId);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to update this course');
    error.statusCode = 403;
    throw error;
  }
  
  course = await Course.findByIdAndUpdate(courseId, courseData, {
    new: true,
    runValidators: true
  });
  
  return course;
};

/**
 * Delete course
 * @param {string} courseId - Course ID
 * @param {Object} user - Current user object
 * @returns {boolean} True if deleted
 */
exports.deleteCourse = async (courseId, user) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Only admin can delete courses
  if (user.role !== 'admin') {
    const error = new Error('Not authorized to delete this course');
    error.statusCode = 403;
    throw error;
  }
  
  await course.remove();
  return true;
};

/**
 * Enroll students in course
 * @param {string} courseId - Course ID
 * @param {Array} studentIds - Array of student IDs to enroll
 * @param {Object} user - Current user object
 * @returns {Object} Updated course
 */
exports.enrollStudents = async (courseId, studentIds, user) => {
  if (!studentIds || !Array.isArray(studentIds)) {
    const error = new Error('Please provide an array of student IDs');
    error.statusCode = 400;
    throw error;
  }
  
  const course = await Course.findById(courseId);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to update this course');
    error.statusCode = 403;
    throw error;
  }
  
  // Verify all students exist and have student role
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'student'
  });
  
  if (students.length !== studentIds.length) {
    const error = new Error('One or more student IDs are invalid');
    error.statusCode = 400;
    throw error;
  }
  
  // Add students to course
  course.students = [...new Set([...course.students.map(id => id.toString()), ...studentIds])];
  await course.save();
  
  return course;
};

/**
 * Remove students from course
 * @param {string} courseId - Course ID
 * @param {Array} studentIds - Array of student IDs to unenroll
 * @param {Object} user - Current user object
 * @returns {Object} Updated course
 */
exports.unenrollStudents = async (courseId, studentIds, user) => {
  if (!studentIds || !Array.isArray(studentIds)) {
    const error = new Error('Please provide an array of student IDs');
    error.statusCode = 400;
    throw error;
  }
  
  const course = await Course.findById(courseId);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to update this course');
    error.statusCode = 403;
    throw error;
  }
  
  // Remove students from course
  course.students = course.students.filter(
    studentId => !studentIds.includes(studentId.toString())
  );
  
  await course.save();
  
  return course;
};
