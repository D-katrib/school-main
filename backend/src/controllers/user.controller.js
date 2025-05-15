const userService = require('../services/user.service');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res, next) => {
  try {
    const result = await userService.getUsers(req.query, req.user);
    
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
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get students for a parent
 * @route   GET /api/users/parent/students
 * @access  Private/Parent
 */
exports.getParentStudents = async (req, res, next) => {
  try {
    const students = await userService.getParentStudents(req.user.id);
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get teachers for a student
 * @route   GET /api/users/student/teachers
 * @access  Private/Student
 */
exports.getStudentTeachers = async (req, res, next) => {
  try {
    const teachers = await userService.getStudentTeachers(req.user.id);
    
    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (err) {
    next(err);
  }
};
