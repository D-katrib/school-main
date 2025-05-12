const courseService = require('../services/course.service');

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = async (req, res, next) => {
  try {
    const result = await courseService.getCourses(req.query, req.user);
    
    res.status(200).json({
      success: true,
      count: result.count,
      pagination: result.pagination,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourse = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private/Admin,Teacher
 */
exports.createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private/Admin,Teacher
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private/Admin
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Enroll students in course
 * @route   PUT /api/courses/:id/enroll
 * @access  Private/Admin,Teacher
 */
exports.enrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }
    
    const course = await courseService.enrollStudents(req.params.id, studentIds, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove students from course
 * @route   PUT /api/courses/:id/unenroll
 * @access  Private/Admin,Teacher
 */
exports.unenrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }
    
    const course = await courseService.unenrollStudents(req.params.id, studentIds, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};
