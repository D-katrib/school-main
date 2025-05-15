const User = require('../models/user.model');

/**
 * Get all users with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @param {Object} user - Current user object
 * @returns {Object} Users and pagination data
 */
exports.getUsers = async (queryParams, user) => {
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
  const parsedQuery = JSON.parse(queryStr);
  
  // Role-based filtering
  if (user && user.role === 'teacher') {
    // Teachers can only see students
    parsedQuery.role = 'student';
  }
  
  query = User.find(parsedQuery);
  
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
  
  // Pagination
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await User.countDocuments(parsedQuery);
  
  query = query.skip(startIndex).limit(limit);
  
  // Executing query
  const users = await query;
  
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
    count: users.length,
    pagination,
    data: users
  };
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
exports.getUserById = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error(`User not found with id of ${userId}`);
    error.statusCode = 404;
    throw error;
  }
  
  return user;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
exports.createUser = async (userData) => {
  // Check if user with email already exists
  const existingUser = await User.findOne({ email: userData.email });
  
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    throw error;
  }
  
  const user = await User.create(userData);
  return user;
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Object} Updated user
 */
exports.updateUser = async (userId, userData) => {
  // Don't allow password updates through this method
  if (userData.password) {
    delete userData.password;
  }
  
  const user = await User.findByIdAndUpdate(userId, userData, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    const error = new Error(`User not found with id of ${userId}`);
    error.statusCode = 404;
    throw error;
  }
  
  return user;
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {boolean} True if deleted
 */
exports.deleteUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    const error = new Error(`User not found with id of ${userId}`);
    error.statusCode = 404;
    throw error;
  }
  
  await User.deleteOne({ _id: userId });
  return true;
};

/**
 * Get students for a parent
 * @param {string} parentId - Parent user ID
 * @returns {Array} Array of student users
 */
exports.getParentStudents = async (parentId) => {
  const parent = await User.findById(parentId);
  
  if (!parent || parent.role !== 'parent') {
    const error = new Error('Not authorized to access this route');
    error.statusCode = 403;
    throw error;
  }
  
  const studentIds = parent.parentDetails?.studentIds || [];
  
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'student'
  });
  
  return students;
};

/**
 * Get teachers for a student
 * @param {string} studentId - Student user ID
 * @returns {Array} Array of teacher users
 */
exports.getStudentTeachers = async (studentId) => {
  const student = await User.findById(studentId).populate({
    path: 'courses',
    select: 'teacher'
  });
  
  if (!student || student.role !== 'student') {
    const error = new Error('Not authorized to access this route');
    error.statusCode = 403;
    throw error;
  }
  
  // Extract unique teacher IDs from courses
  const teacherIds = [...new Set(
    student.courses.map(course => course.teacher.toString())
  )];
  
  const teachers = await User.find({
    _id: { $in: teacherIds },
    role: 'teacher'
  });
  
  return teachers;
};
