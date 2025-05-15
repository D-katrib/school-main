const enrollmentRequestService = require('../services/enrollment-request.service');

/**
 * @desc    Create a new enrollment request
 * @route   POST /api/courses/:id/enroll-request
 * @access  Private/Student
 */
exports.createEnrollmentRequest = async (req, res, next) => {
  try {
    const enrollmentRequest = await enrollmentRequestService.createEnrollmentRequest(
      req.params.id,
      req.user
    );
    
    res.status(201).json({
      success: true,
      data: enrollmentRequest
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get enrollment requests for a course
 * @route   GET /api/courses/:id/enrollment-requests
 * @access  Private/Admin,Teacher
 */
exports.getEnrollmentRequestsByCourse = async (req, res, next) => {
  try {
    const requests = await enrollmentRequestService.getEnrollmentRequestsByCourse(
      req.params.id,
      req.user,
      req.query
    );
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get enrollment requests for current student
 * @route   GET /api/enrollment-requests
 * @access  Private/Student
 */
exports.getMyEnrollmentRequests = async (req, res, next) => {
  try {
    const requests = await enrollmentRequestService.getEnrollmentRequestsByStudent(
      req.user,
      req.query
    );
    
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Process an enrollment request (approve or reject)
 * @route   PUT /api/enrollment-requests/:id
 * @access  Private/Admin,Teacher
 */
exports.processEnrollmentRequest = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status (approved or rejected)'
      });
    }
    
    const enrollmentRequest = await enrollmentRequestService.processEnrollmentRequest(
      req.params.id,
      status,
      notes,
      req.user
    );
    
    res.status(200).json({
      success: true,
      data: enrollmentRequest
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel an enrollment request
 * @route   DELETE /api/enrollment-requests/:id
 * @access  Private/Student
 */
exports.cancelEnrollmentRequest = async (req, res, next) => {
  try {
    await enrollmentRequestService.cancelEnrollmentRequest(
      req.params.id,
      req.user
    );
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
