const assignmentService = require('../services/assignment.service');

/**
 * @desc    Get all assignments
 * @route   GET /api/assignments
 * @access  Private
 */
exports.getAssignments = async (req, res, next) => {
  try {
    const result = await assignmentService.getAssignments(req.query, req.user);
    
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
 * @desc    Get single assignment
 * @route   GET /api/assignments/:id
 * @access  Private
 */
exports.getAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new assignment
 * @route   POST /api/assignments
 * @access  Private/Admin,Teacher
 */
exports.createAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.createAssignment(req.body, req.user);
    
    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update assignment
 * @route   PUT /api/assignments/:id
 * @access  Private/Admin,Teacher
 */
exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.updateAssignment(req.params.id, req.body, req.user);
    
    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete assignment
 * @route   DELETE /api/assignments/:id
 * @access  Private/Admin,Teacher
 */
exports.deleteAssignment = async (req, res, next) => {
  try {
    await assignmentService.deleteAssignment(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit assignment
 * @route   POST /api/assignments/:id/submit
 * @access  Private/Student
 */
exports.submitAssignment = async (req, res, next) => {
  try {
    const submission = await assignmentService.submitAssignment(req.params.id, req.body, req.user);
    
    res.status(201).json({
      success: true,
      data: submission
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all submissions for an assignment
 * @route   GET /api/assignments/:id/submissions
 * @access  Private/Admin,Teacher
 */
exports.getSubmissions = async (req, res, next) => {
  try {
    const submissions = await assignmentService.getSubmissions(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Grade submission
 * @route   PUT /api/assignments/submissions/:id
 * @access  Private/Admin,Teacher
 */
exports.gradeSubmission = async (req, res, next) => {
  try {
    const submission = await assignmentService.gradeSubmission(req.params.id, req.body, req.user);
    
    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (err) {
    next(err);
  }
};
