const Course = require('../models/course.model');
const User = require('../models/user.model');
const EnrollmentRequest = require('../models/enrollment-request.model');

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
  const parsedQuery = JSON.parse(queryStr);
  
  // Initialize query
  query = Course.find(parsedQuery);
  
  // Role-based filtering
  if (user && user.role === 'student') {
    // Students can see all active courses
    // No additional filter needed, they should see all courses to be able to request enrollment
  } else if (user && user.role === 'teacher') {
    // Teachers can see courses they teach and all other courses for reference
    // No additional filter needed, they should see all courses
  } else if (user && user.role === 'parent') {
    // Parents can see courses their children are enrolled in
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    query = query.find({ students: { $in: studentIds } });
  }
  // Admin can see all courses by default
  
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
  const total = await Course.countDocuments(parsedQuery);
  
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
  // Students can view all course details to decide if they want to enroll
  if (user.role === 'teacher' && course.teacher._id.toString() !== user.id) {
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
  
  // If user is a teacher or admin, fetch available students for enrollment
  if (user.role === 'teacher' || user.role === 'admin') {
    // Get all students with role 'student'
    const allStudents = await User.find({ role: 'student' })
      .select('firstName lastName email');
    
    // Filter out already enrolled students
    const enrolledIds = course.students.map(student => student._id.toString());
    const availableStudents = allStudents.filter(student => !enrolledIds.includes(student._id.toString()));
    
    // Add available students to course object (not saved to database)
    course._doc.availableStudents = availableStudents;
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
  // Verify user has permission to create course
  if (user.role === 'student' || user.role === 'parent') {
    const error = new Error('Not authorized to create courses');
    error.statusCode = 403;
    throw error;
  }

  // If teacher, set teacher to current user
  if (user.role === 'teacher') {
    courseData.teacher = user.id;
  }
  
  // Verify teacher exists and has teacher role
  if (courseData.teacher) {
    const teacher = await User.findById(courseData.teacher);
    
    if (!teacher) {
      const error = new Error(`Teacher not found with id of ${courseData.teacher}`);
      error.statusCode = 404;
      throw error;
    }
    
    if (teacher.role !== 'teacher') {
      const error = new Error('The specified user is not a teacher');
      error.statusCode = 400;
      throw error;
    }
  } else {
    const error = new Error('Teacher is required');
    error.statusCode = 400;
    throw error;
  }
  
  // Create course
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
  
  // Admin can delete any course, teachers can only delete their own courses
  if (user.role === 'admin' || (user.role === 'teacher' && course.teacher.toString() === user.id)) {
    await Course.deleteOne({ _id: courseId });
    return true;
  } else {
    const error = new Error('Not authorized to delete this course');
    error.statusCode = 403;
    throw error;
  }
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
  
  // Delete any enrollment requests for these students for this course
  // This ensures students can request enrollment again after being removed
  for (const studentId of studentIds) {
    await EnrollmentRequest.deleteMany({
      student: studentId,
      course: courseId
    });
  }
  
  await course.save();
  
  return course;
};

/**
 * Add material to course
 * @param {string} courseId - Course ID
 * @param {Object} materialData - Material data to add
 * @param {Object} user - Current user object
 * @returns {Object} Updated course
 */
exports.addCourseMaterial = async (courseId, materialData, user) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role !== 'admin' && (user.role !== 'teacher' || course.teacher.toString() !== user.id)) {
    const error = new Error('Not authorized to add materials to this course');
    error.statusCode = 403;
    throw error;
  }
  
  // Validate material data
  if (!materialData.title) {
    const error = new Error('Please provide a title for the material');
    error.statusCode = 400;
    throw error;
  }
  
  if (!materialData.type) {
    const error = new Error('Please specify the material type');
    error.statusCode = 400;
    throw error;
  }
  
  // URL is required unless it's a file upload (the URL will be generated by the controller)
  if (!materialData.url && !materialData._fileUploaded) {
    const error = new Error('Please provide a URL for the material or upload a file');
    error.statusCode = 400;
    throw error;
  }
  
  // Add the material to the course
  course.materials.push({
    ...materialData,
    addedBy: user.id,
    uploadDate: Date.now()
  });
  
  await course.save();
  
  return course;
};

/**
 * Remove material from course
 * @param {string} courseId - Course ID
 * @param {string} materialId - Material ID to remove
 * @param {Object} user - Current user object
 * @returns {Object} Updated course
 */
exports.removeCourseMaterial = async (courseId, materialId, user) => {
  const course = await Course.findById(courseId);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role !== 'admin' && (user.role !== 'teacher' || course.teacher.toString() !== user.id)) {
    const error = new Error('Not authorized to remove materials from this course');
    error.statusCode = 403;
    throw error;
  }
  
  // Find the material
  const materialIndex = course.materials.findIndex(material => material._id.toString() === materialId);
  
  if (materialIndex === -1) {
    const error = new Error(`Material not found with id of ${materialId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Remove the material
  course.materials.splice(materialIndex, 1);
  
  await course.save();
  
  return course;
};

/**
 * Get course materials
 * @param {string} courseId - Course ID
 * @param {Object} user - Current user object
 * @returns {Array} Course materials
 */
exports.getCourseMaterials = async (courseId, user) => {
  const course = await Course.findById(courseId)
    .populate({
      path: 'materials.addedBy',
      select: 'firstName lastName'
    });
  
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if user has access to this course
  if (user.role === 'student') {
    // Students can only view materials if they are enrolled in the course
    const isEnrolled = course.students.some(studentId => studentId.toString() === user.id);
    if (!isEnrolled) {
      const error = new Error('Not authorized to view materials for this course');
      error.statusCode = 403;
      throw error;
    }
  } else if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to view materials for this course');
    error.statusCode = 403;
    throw error;
  }
  
  return course.materials;
};
