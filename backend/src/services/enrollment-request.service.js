const EnrollmentRequest = require('../models/enrollment-request.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');

/**
 * Create a new enrollment request
 * @param {string} courseId - Course ID
 * @param {Object} user - Current user object (student)
 * @returns {Object} Created enrollment request
 */
exports.createEnrollmentRequest = async (courseId, user) => {
  // Verify user is a student
  if (user.role !== 'student') {
    const error = new Error('Only students can request enrollment');
    error.statusCode = 403;
    throw error;
  }

  // Verify course exists
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }

  // Check if student is already enrolled in the course
  if (course.students.includes(user.id)) {
    const error = new Error('You are already enrolled in this course');
    error.statusCode = 400;
    throw error;
  }

  // Check if there's any existing request (pending, approved, or rejected)
  const existingRequest = await EnrollmentRequest.findOne({
    student: user.id,
    course: courseId
  });

  if (existingRequest) {
    // If there's a pending request, don't allow a new one
    if (existingRequest.status === 'pending') {
      const error = new Error('You already have a pending enrollment request for this course');
      error.statusCode = 400;
      throw error;
    }
    
    // If there's a rejected request, update it to pending instead of creating a new one
    if (existingRequest.status === 'rejected') {
      existingRequest.status = 'pending';
      existingRequest.requestDate = Date.now();
      existingRequest.responseDate = null;
      existingRequest.responseBy = null;
      existingRequest.notes = null;
      await existingRequest.save();
      return existingRequest;
    }
    
    // If there's an approved request, the student is already enrolled or in the process
    if (existingRequest.status === 'approved') {
      const error = new Error('Your enrollment request for this course has already been approved');
      error.statusCode = 400;
      throw error;
    }
  }

  // Create a new enrollment request if no existing request was found
  const enrollmentRequest = await EnrollmentRequest.create({
    student: user.id,
    course: courseId
  });

  return enrollmentRequest;
};

/**
 * Get all enrollment requests for a course
 * @param {string} courseId - Course ID
 * @param {Object} user - Current user object (teacher or admin)
 * @param {Object} queryParams - Query parameters
 * @returns {Array} Enrollment requests
 */
exports.getEnrollmentRequestsByCourse = async (courseId, user, queryParams = {}) => {
  // Verify course exists
  const course = await Course.findById(courseId);
  if (!course) {
    const error = new Error(`Course not found with id of ${courseId}`);
    error.statusCode = 404;
    throw error;
  }

  // Verify user has permission (teacher of the course or admin)
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to view enrollment requests for this course');
    error.statusCode = 403;
    throw error;
  }

  // Build query
  const query = {
    course: courseId
  };

  // Add status filter if provided
  if (queryParams.status) {
    query.status = queryParams.status;
  }

  // Get enrollment requests
  const requests = await EnrollmentRequest.find(query)
    .populate({
      path: 'student',
      select: 'firstName lastName email'
    })
    .sort({ createdAt: -1 });

  return requests;
};

/**
 * Get all enrollment requests for a student
 * @param {Object} user - Current user object (student)
 * @param {Object} queryParams - Query parameters
 * @returns {Array} Enrollment requests
 */
exports.getEnrollmentRequestsByStudent = async (user, queryParams = {}) => {
  // Verify user is a student
  if (user.role !== 'student') {
    const error = new Error('Only students can view their enrollment requests');
    error.statusCode = 403;
    throw error;
  }

  // Build query
  const query = {
    student: user.id
  };

  // Add status filter if provided
  if (queryParams.status) {
    query.status = queryParams.status;
  }

  // Get enrollment requests
  const requests = await EnrollmentRequest.find(query)
    .populate({
      path: 'course',
      select: 'name code teacher',
      populate: {
        path: 'teacher',
        select: 'firstName lastName'
      }
    })
    .sort({ createdAt: -1 });

  return requests;
};

/**
 * Process an enrollment request (approve or reject)
 * @param {string} requestId - Enrollment request ID
 * @param {string} status - New status ('approved' or 'rejected')
 * @param {string} notes - Optional notes
 * @param {Object} user - Current user object (teacher or admin)
 * @returns {Object} Updated enrollment request
 */
exports.processEnrollmentRequest = async (requestId, status, notes, user) => {
  // Verify status is valid
  if (!['approved', 'rejected'].includes(status)) {
    const error = new Error('Status must be either approved or rejected');
    error.statusCode = 400;
    throw error;
  }

  // Get enrollment request
  const enrollmentRequest = await EnrollmentRequest.findById(requestId);
  if (!enrollmentRequest) {
    const error = new Error(`Enrollment request not found with id of ${requestId}`);
    error.statusCode = 404;
    throw error;
  }

  // Verify request is pending
  if (enrollmentRequest.status !== 'pending') {
    const error = new Error(`This enrollment request has already been ${enrollmentRequest.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Get course
  const course = await Course.findById(enrollmentRequest.course);
  if (!course) {
    const error = new Error('Associated course not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify user has permission (teacher of the course or admin)
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to process enrollment requests for this course');
    error.statusCode = 403;
    throw error;
  }

  // Update enrollment request
  enrollmentRequest.status = status;
  enrollmentRequest.responseDate = Date.now();
  enrollmentRequest.responseBy = user.id;
  if (notes) {
    enrollmentRequest.notes = notes;
  }

  // If approved, add student to course
  if (status === 'approved') {
    // Check if student is already enrolled (shouldn't happen, but just in case)
    if (!course.students.includes(enrollmentRequest.student)) {
      course.students.push(enrollmentRequest.student);
      await course.save();
    }
  }

  await enrollmentRequest.save();

  return enrollmentRequest;
};

/**
 * Cancel an enrollment request
 * @param {string} requestId - Enrollment request ID
 * @param {Object} user - Current user object (student)
 * @returns {boolean} True if canceled
 */
exports.cancelEnrollmentRequest = async (requestId, user) => {
  // Verify user is a student
  if (user.role !== 'student') {
    const error = new Error('Only students can cancel their enrollment requests');
    error.statusCode = 403;
    throw error;
  }

  // Get enrollment request
  const enrollmentRequest = await EnrollmentRequest.findById(requestId);
  if (!enrollmentRequest) {
    const error = new Error(`Enrollment request not found with id of ${requestId}`);
    error.statusCode = 404;
    throw error;
  }

  // Verify student owns the request
  if (enrollmentRequest.student.toString() !== user.id) {
    const error = new Error('Not authorized to cancel this enrollment request');
    error.statusCode = 403;
    throw error;
  }

  // Verify request is pending
  if (enrollmentRequest.status !== 'pending') {
    const error = new Error(`Cannot cancel a request that has already been ${enrollmentRequest.status}`);
    error.statusCode = 400;
    throw error;
  }

  // Delete the enrollment request
  await EnrollmentRequest.deleteOne({ _id: requestId });

  return true;
};
