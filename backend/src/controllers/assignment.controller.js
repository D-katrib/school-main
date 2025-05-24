const assignmentService = require('../services/assignment.service');
const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');

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
    // Handle file uploads if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      const uploadService = require('../services/upload.service');
      attachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: uploadService.getFileUrl(req, file.filename, 'assignments'),
        fileType: file.mimetype,
        uploadDate: Date.now()
      }));
    }
    
    // Merge attachments with request body
    const assignmentData = {
      ...req.body,
      attachments: attachments.length > 0 ? attachments : req.body.attachments
    };
    
    const assignment = await assignmentService.createAssignment(assignmentData, req.user);
    
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
    // Handle file uploads if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      const uploadService = require('../services/upload.service');
      attachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: uploadService.getFileUrl(req, file.filename, 'assignments'),
        fileType: file.mimetype,
        uploadDate: Date.now()
      }));
    }
    
    // Merge attachments with request body
    const assignmentData = {
      ...req.body,
      attachments: attachments.length > 0 ? attachments : req.body.attachments
    };
    
    const assignment = await assignmentService.updateAssignment(req.params.id, assignmentData, req.user);
    
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
    // Check if user is a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can submit assignments'
      });
    }
    
    console.log(`Processing assignment submission for assignment ${req.params.id} by student ${req.user.id}`);
    
    // Process file uploads if any
    let attachments = [];
    
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files`);
      attachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype
      }));
    }
    
    // Create submission data
    const submissionData = {
      content: req.body.content,
      attachments
    };
    
    // Check if student has already submitted this assignment
    const existingSubmission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id
    });
    
    if (existingSubmission) {
      console.log(`Student ${req.user.id} has already submitted assignment ${req.params.id}`);
      console.log(`Existing submission ID: ${existingSubmission._id}`);
    }
    
    // Submit assignment
    const submission = await assignmentService.submitAssignment(
      req.params.id,
      submissionData,
      req.user
    );
    
    console.log(`Submission successful. Submission ID: ${submission._id}`);
    
    // Update assignment with submission ID if it's a new submission
    if (!existingSubmission) {
      console.log(`Updating assignment ${req.params.id} with new submission ID ${submission._id}`);
      await Assignment.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { submissionIds: submission._id } },
        { new: true }
      );
    }
    
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
