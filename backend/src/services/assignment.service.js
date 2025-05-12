const Assignment = require('../models/assignment.model');
const Course = require('../models/course.model');
const Submission = require('../models/submission.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

/**
 * Get all assignments with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @param {Object} user - Current user object
 * @returns {Object} Assignments and pagination data
 */
exports.getAssignments = async (queryParams, user) => {
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
  query = Assignment.find(JSON.parse(queryStr));
  
  // Role-based filtering
  if (user.role === 'student') {
    // Students can only see assignments for courses they're enrolled in
    const courses = await Course.find({ students: user.id }).select('_id');
    const courseIds = courses.map(course => course._id);
    query = query.find({ course: { $in: courseIds }, isPublished: true });
  } else if (user.role === 'teacher') {
    // Teachers can only see assignments for courses they teach
    const courses = await Course.find({ teacher: user.id }).select('_id');
    const courseIds = courses.map(course => course._id);
    query = query.find({ course: { $in: courseIds } });
  } else if (user.role === 'parent') {
    // Parents can see assignments for courses their children are enrolled in
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    const courses = await Course.find({ students: { $in: studentIds } }).select('_id');
    const courseIds = courses.map(course => course._id);
    query = query.find({ course: { $in: courseIds }, isPublished: true });
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
    query = query.sort('-dueDate');
  }
  
  // Get total count for pagination
  const total = await Assignment.countDocuments(query.getQuery());
  
  // Pagination
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  query = query.skip(startIndex).limit(limit);
  
  // Populate course
  query = query.populate({
    path: 'course',
    select: 'name code'
  }).populate({
    path: 'createdBy',
    select: 'firstName lastName'
  });
  
  // Executing query
  const assignments = await query;
  
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
    count: assignments.length,
    pagination,
    data: assignments
  };
};

/**
 * Get assignment by ID
 * @param {string} assignmentId - Assignment ID
 * @param {Object} user - Current user object
 * @returns {Object} Assignment object
 */
exports.getAssignmentById = async (assignmentId, user) => {
  const assignment = await Assignment.findById(assignmentId)
    .populate({
      path: 'course',
      select: 'name code teacher students'
    })
    .populate({
      path: 'createdBy',
      select: 'firstName lastName'
    });
  
  if (!assignment) {
    const error = new Error(`Assignment not found with id of ${assignmentId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if user has access to this assignment
  if (user.role === 'student') {
    // Students can only see published assignments for courses they're enrolled in
    const isEnrolled = assignment.course.students.some(
      studentId => studentId.toString() === user.id
    );
    
    if (!isEnrolled || !assignment.isPublished) {
      const error = new Error('Not authorized to access this assignment');
      error.statusCode = 403;
      throw error;
    }
    
    // Check if student has submitted this assignment
    const submission = await Submission.findOne({
      assignment: assignment._id,
      student: user.id
    });
    
    assignment._doc.submission = submission;
  } else if (user.role === 'teacher') {
    // Teachers can only see assignments for courses they teach
    if (assignment.course.teacher.toString() !== user.id) {
      const error = new Error('Not authorized to access this assignment');
      error.statusCode = 403;
      throw error;
    }
  } else if (user.role === 'parent') {
    // Parents can see assignments for courses their children are enrolled in
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    
    const isParentOfEnrolledStudent = assignment.course.students.some(
      studentId => studentIds.includes(studentId.toString())
    );
    
    if (!isParentOfEnrolledStudent || !assignment.isPublished) {
      const error = new Error('Not authorized to access this assignment');
      error.statusCode = 403;
      throw error;
    }
  }
  
  return assignment;
};

/**
 * Create new assignment
 * @param {Object} assignmentData - Assignment data
 * @param {Object} user - Current user object
 * @returns {Object} Created assignment
 */
exports.createAssignment = async (assignmentData, user) => {
  // Set creator to current user
  assignmentData.createdBy = user.id;
  
  // Check if course exists and user is authorized
  const course = await Course.findById(assignmentData.course);
  
  if (!course) {
    const error = new Error(`Course not found with id of ${assignmentData.course}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to create assignments for this course');
    error.statusCode = 403;
    throw error;
  }
  
  const assignment = await Assignment.create(assignmentData);
  
  // If assignment is published, send notifications to enrolled students
  if (assignment.isPublished) {
    course.students.forEach(async (studentId) => {
      await Notification.createNotification({
        recipient: studentId,
        sender: user.id,
        type: 'assignment',
        title: 'New Assignment',
        message: `A new assignment "${assignment.title}" has been posted for ${course.name}`,
        relatedResource: {
          resourceType: 'assignment',
          resourceId: assignment._id
        },
        priority: 'normal'
      });
    });
  }
  
  return assignment;
};

/**
 * Update assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} assignmentData - Assignment data to update
 * @param {Object} user - Current user object
 * @returns {Object} Updated assignment
 */
exports.updateAssignment = async (assignmentId, assignmentData, user) => {
  let assignment = await Assignment.findById(assignmentId);
  
  if (!assignment) {
    const error = new Error(`Assignment not found with id of ${assignmentId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if course exists and user is authorized
  const course = await Course.findById(assignment.course);
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to update this assignment');
    error.statusCode = 403;
    throw error;
  }
  
  // Check if assignment is being published
  const isBeingPublished = !assignment.isPublished && assignmentData.isPublished;
  
  assignment = await Assignment.findByIdAndUpdate(assignmentId, assignmentData, {
    new: true,
    runValidators: true
  });
  
  // If assignment is being published, send notifications to enrolled students
  if (isBeingPublished) {
    course.students.forEach(async (studentId) => {
      await Notification.createNotification({
        recipient: studentId,
        sender: user.id,
        type: 'assignment',
        title: 'New Assignment',
        message: `A new assignment "${assignment.title}" has been posted for ${course.name}`,
        relatedResource: {
          resourceType: 'assignment',
          resourceId: assignment._id
        },
        priority: 'normal'
      });
    });
  }
  
  return assignment;
};

/**
 * Delete assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} user - Current user object
 * @returns {boolean} True if deleted
 */
exports.deleteAssignment = async (assignmentId, user) => {
  const assignment = await Assignment.findById(assignmentId);
  
  if (!assignment) {
    const error = new Error(`Assignment not found with id of ${assignmentId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if course exists and user is authorized
  const course = await Course.findById(assignment.course);
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to delete this assignment');
    error.statusCode = 403;
    throw error;
  }
  
  await assignment.remove();
  return true;
};

/**
 * Submit assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} submissionData - Submission data
 * @param {Object} user - Current user object
 * @returns {Object} Submission object
 */
exports.submitAssignment = async (assignmentId, submissionData, user) => {
  const assignment = await Assignment.findById(assignmentId);
  
  if (!assignment) {
    const error = new Error(`Assignment not found with id of ${assignmentId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if assignment is published
  if (!assignment.isPublished) {
    const error = new Error('Cannot submit to an unpublished assignment');
    error.statusCode = 400;
    throw error;
  }
  
  // Check if course exists and user is enrolled
  const course = await Course.findById(assignment.course);
  
  const isEnrolled = course.students.some(
    studentId => studentId.toString() === user.id
  );
  
  if (!isEnrolled) {
    const error = new Error('Not authorized to submit to this assignment');
    error.statusCode = 403;
    throw error;
  }
  
  // Check if assignment is past due date and late submissions are not allowed
  const now = new Date();
  if (now > assignment.dueDate && !assignment.allowLateSubmissions) {
    const error = new Error('Assignment is past due date and late submissions are not allowed');
    error.statusCode = 400;
    throw error;
  }
  
  // Check if student has already submitted
  let submission = await Submission.findOne({
    assignment: assignment._id,
    student: user.id
  });
  
  if (submission) {
    // Update existing submission
    submission.content = submissionData.content || submission.content;
    submission.attachments = submissionData.attachments || submission.attachments;
    submission.submittedAt = now;
    submission.isLate = now > assignment.dueDate;
    
    await submission.save();
  } else {
    // Create new submission
    submission = await Submission.create({
      assignment: assignment._id,
      student: user.id,
      content: submissionData.content,
      attachments: submissionData.attachments,
      submittedAt: now,
      isLate: now > assignment.dueDate
    });
  }
  
  // Notify teacher of submission
  await Notification.createNotification({
    recipient: course.teacher,
    sender: user.id,
    type: 'submission',
    title: 'Assignment Submission',
    message: `A student has submitted the assignment "${assignment.title}"`,
    relatedResource: {
      resourceType: 'submission',
      resourceId: submission._id
    },
    priority: 'normal'
  });
  
  return submission;
};

/**
 * Get all submissions for an assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} user - Current user object
 * @returns {Array} Array of submissions
 */
exports.getSubmissions = async (assignmentId, user) => {
  const assignment = await Assignment.findById(assignmentId);
  
  if (!assignment) {
    const error = new Error(`Assignment not found with id of ${assignmentId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Check if course exists and user is authorized
  const course = await Course.findById(assignment.course);
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to view submissions for this assignment');
    error.statusCode = 403;
    throw error;
  }
  
  const submissions = await Submission.find({ assignment: assignment._id })
    .populate({
      path: 'student',
      select: 'firstName lastName email'
    });
  
  return submissions;
};

/**
 * Grade submission
 * @param {string} submissionId - Submission ID
 * @param {Object} gradeData - Grade data
 * @param {Object} user - Current user object
 * @returns {Object} Updated submission
 */
exports.gradeSubmission = async (submissionId, gradeData, user) => {
  let submission = await Submission.findById(submissionId);
  
  if (!submission) {
    const error = new Error(`Submission not found with id of ${submissionId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Get assignment and course
  const assignment = await Assignment.findById(submission.assignment);
  const course = await Course.findById(assignment.course);
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && course.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to grade this submission');
    error.statusCode = 403;
    throw error;
  }
  
  // Update submission with grade and feedback
  submission.score = gradeData.score;
  submission.feedback = gradeData.feedback;
  submission.gradedBy = user.id;
  submission.gradedAt = Date.now();
  submission.status = 'graded';
  
  await submission.save();
  
  // Create grade record
  const Grade = require('../models/grade.model');
  await Grade.create({
    student: submission.student,
    course: course._id,
    assignment: assignment._id,
    type: 'assignment',
    score: submission.score,
    maxScore: assignment.totalPoints,
    comments: submission.feedback,
    gradedBy: user.id,
    isPublished: gradeData.publishGrade || false
  });
  
  // Notify student of graded submission
  await Notification.createNotification({
    recipient: submission.student,
    sender: user.id,
    type: 'grade',
    title: 'Assignment Graded',
    message: `Your submission for "${assignment.title}" has been graded`,
    relatedResource: {
      resourceType: 'submission',
      resourceId: submission._id
    },
    priority: 'high'
  });
  
  return submission;
};
