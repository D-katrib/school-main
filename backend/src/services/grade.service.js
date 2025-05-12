const Grade = require('../models/grade.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

/**
 * Get grades with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @param {Object} user - Current user object
 * @returns {Object} Grades and pagination data
 */
exports.getGrades = async (queryParams, user) => {
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
  query = Grade.find(JSON.parse(queryStr));
  
  // Role-based filtering
  if (user.role === 'student') {
    // Students can only see their own published grades
    query = query.find({ 
      student: user.id,
      isPublished: true
    });
  } else if (user.role === 'teacher') {
    // Teachers can only see grades for courses they teach
    const courses = await Course.find({ teacher: user.id }).select('_id');
    const courseIds = courses.map(course => course._id);
    query = query.find({ course: { $in: courseIds } });
  } else if (user.role === 'parent') {
    // Parents can see grades for their children
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    query = query.find({ 
      student: { $in: studentIds },
      isPublished: true
    });
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
    query = query.sort('-gradedAt');
  }
  
  // Get total count for pagination
  const total = await Grade.countDocuments(query.getQuery());
  
  // Pagination
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  query = query.skip(startIndex).limit(limit);
  
  // Populate
  query = query.populate({
    path: 'student',
    select: 'firstName lastName'
  }).populate({
    path: 'course',
    select: 'name code'
  }).populate({
    path: 'assignment',
    select: 'title dueDate'
  }).populate({
    path: 'gradedBy',
    select: 'firstName lastName'
  });
  
  // Executing query
  const grades = await query;
  
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
    count: grades.length,
    pagination,
    data: grades
  };
};

/**
 * Get course grade summary for a student
 * @param {Object} params - Parameters for summary (studentId, courseId)
 * @param {Object} user - Current user object
 * @returns {Object} Grade summary
 */
exports.getGradeSummary = async (params, user) => {
  const { studentId, courseId } = params;
  
  // Role-based access control
  if (user.role === 'student') {
    // Students can only see their own grade summary
    if (studentId && studentId !== user.id) {
      const error = new Error('Not authorized to access this student\'s grades');
      error.statusCode = 403;
      throw error;
    }
    
    if (!courseId) {
      const error = new Error('Course ID is required');
      error.statusCode = 400;
      throw error;
    }
    
    const summary = await Grade.calculateCourseGrade(user.id, courseId);
    return summary;
  } else if (user.role === 'parent') {
    // Parents can only see their children's grade summary
    if (!studentId || !courseId) {
      const error = new Error('Student ID and Course ID are required');
      error.statusCode = 400;
      throw error;
    }
    
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    
    if (!studentIds.includes(studentId)) {
      const error = new Error('Not authorized to access this student\'s grades');
      error.statusCode = 403;
      throw error;
    }
    
    const summary = await Grade.calculateCourseGrade(studentId, courseId);
    return summary;
  } else if (user.role === 'teacher') {
    // Teachers can see grade summaries for students in courses they teach
    if (!studentId || !courseId) {
      const error = new Error('Student ID and Course ID are required');
      error.statusCode = 400;
      throw error;
    }
    
    const course = await Course.findById(courseId);
    
    if (!course || course.teacher.toString() !== user.id) {
      const error = new Error('Not authorized to access grades for this course');
      error.statusCode = 403;
      throw error;
    }
    
    const isEnrolled = course.students.some(
      id => id.toString() === studentId
    );
    
    if (!isEnrolled) {
      const error = new Error('Student is not enrolled in this course');
      error.statusCode = 400;
      throw error;
    }
    
    const summary = await Grade.calculateCourseGrade(studentId, courseId);
    return summary;
  } else if (user.role === 'admin') {
    // Admins can see all grade summaries
    if (!studentId || !courseId) {
      const error = new Error('Student ID and Course ID are required');
      error.statusCode = 400;
      throw error;
    }
    
    const summary = await Grade.calculateCourseGrade(studentId, courseId);
    return summary;
  }
};

/**
 * Record grade
 * @param {Object} gradeData - Grade data
 * @param {Object} user - Current user object
 * @returns {Object} Grade record
 */
exports.recordGrade = async (gradeData, user) => {
  const { student, course, assignment, type, score, maxScore, weight, comments, isPublished } = gradeData;
  
  // Check if course exists and user is authorized
  const courseDoc = await Course.findById(course);
  
  if (!courseDoc) {
    const error = new Error(`Course not found with id of ${course}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && courseDoc.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to record grades for this course');
    error.statusCode = 403;
    throw error;
  }
  
  // Check if student is enrolled in course
  const isEnrolled = courseDoc.students.some(
    studentId => studentId.toString() === student
  );
  
  if (!isEnrolled) {
    const error = new Error('Student is not enrolled in this course');
    error.statusCode = 400;
    throw error;
  }
  
  // Check if grade already exists
  const existingGrade = await Grade.findOne({
    student,
    course,
    assignment,
    type
  });
  
  let grade;
  
  if (existingGrade) {
    // Update existing grade
    existingGrade.score = score;
    existingGrade.maxScore = maxScore;
    existingGrade.weight = weight || existingGrade.weight;
    existingGrade.comments = comments;
    existingGrade.gradedBy = user.id;
    existingGrade.gradedAt = Date.now();
    
    // Check if grade is being published
    const isBeingPublished = !existingGrade.isPublished && isPublished;
    existingGrade.isPublished = isPublished;
    
    if (isPublished && !existingGrade.publishedAt) {
      existingGrade.publishedAt = Date.now();
    }
    
    grade = await existingGrade.save();
    
    // If grade is being published, send notification
    if (isBeingPublished) {
      // Notify student
      await Notification.createNotification({
        recipient: student,
        sender: user.id,
        type: 'grade',
        title: 'New Grade Posted',
        message: `A new grade has been posted for ${courseDoc.name}: ${type}`,
        relatedResource: {
          resourceType: 'grade',
          resourceId: grade._id
        },
        priority: 'high'
      });
      
      // Find student's parents and notify them
      const studentDoc = await User.findById(student);
      const parentIds = studentDoc.studentDetails?.parentIds || [];
      
      parentIds.forEach(async (parentId) => {
        await Notification.createNotification({
          recipient: parentId,
          sender: user.id,
          type: 'grade',
          title: 'New Grade Posted',
          message: `A new grade has been posted for ${studentDoc.firstName} ${studentDoc.lastName} in ${courseDoc.name}: ${type}`,
          relatedResource: {
            resourceType: 'grade',
            resourceId: grade._id
          },
          priority: 'high'
        });
      });
    }
  } else {
    // Create new grade
    grade = await Grade.create({
      student,
      course,
      assignment,
      type,
      score,
      maxScore,
      weight: weight || 1,
      comments,
      gradedBy: user.id,
      isPublished,
      publishedAt: isPublished ? Date.now() : undefined
    });
    
    // If grade is published, send notification
    if (isPublished) {
      // Notify student
      await Notification.createNotification({
        recipient: student,
        sender: user.id,
        type: 'grade',
        title: 'New Grade Posted',
        message: `A new grade has been posted for ${courseDoc.name}: ${type}`,
        relatedResource: {
          resourceType: 'grade',
          resourceId: grade._id
        },
        priority: 'high'
      });
      
      // Find student's parents and notify them
      const studentDoc = await User.findById(student);
      const parentIds = studentDoc.studentDetails?.parentIds || [];
      
      parentIds.forEach(async (parentId) => {
        await Notification.createNotification({
          recipient: parentId,
          sender: user.id,
          type: 'grade',
          title: 'New Grade Posted',
          message: `A new grade has been posted for ${studentDoc.firstName} ${studentDoc.lastName} in ${courseDoc.name}: ${type}`,
          relatedResource: {
            resourceType: 'grade',
            resourceId: grade._id
          },
          priority: 'high'
        });
      });
    }
  }
  
  return grade;
};

/**
 * Bulk record grades
 * @param {Object} bulkData - Bulk grade data
 * @param {Object} user - Current user object
 * @returns {Array} Array of results
 */
exports.bulkRecordGrades = async (bulkData, user) => {
  const { course, assignment, type, grades } = bulkData;
  
  if (!course || !type || !grades || !Array.isArray(grades)) {
    const error = new Error('Please provide course, type, and grades array');
    error.statusCode = 400;
    throw error;
  }
  
  // Check if course exists and user is authorized
  const courseDoc = await Course.findById(course);
  
  if (!courseDoc) {
    const error = new Error(`Course not found with id of ${course}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && courseDoc.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to record grades for this course');
    error.statusCode = 403;
    throw error;
  }
  
  const results = [];
  const notifications = [];
  
  // Process each grade
  for (const gradeData of grades) {
    const { student, score, maxScore, weight, comments, isPublished } = gradeData;
    
    // Check if student is enrolled in course
    const isEnrolled = courseDoc.students.some(
      studentId => studentId.toString() === student
    );
    
    if (!isEnrolled) {
      results.push({
        student,
        success: false,
        message: 'Student is not enrolled in this course'
      });
      continue;
    }
    
    try {
      // Check if grade already exists
      const existingGrade = await Grade.findOne({
        student,
        course,
        assignment,
        type
      });
      
      let grade;
      let isBeingPublished = false;
      
      if (existingGrade) {
        // Update existing grade
        existingGrade.score = score;
        existingGrade.maxScore = maxScore;
        existingGrade.weight = weight || existingGrade.weight;
        existingGrade.comments = comments;
        existingGrade.gradedBy = user.id;
        existingGrade.gradedAt = Date.now();
        
        // Check if grade is being published
        isBeingPublished = !existingGrade.isPublished && isPublished;
        existingGrade.isPublished = isPublished;
        
        if (isPublished && !existingGrade.publishedAt) {
          existingGrade.publishedAt = Date.now();
        }
        
        grade = await existingGrade.save();
      } else {
        // Create new grade
        grade = await Grade.create({
          student,
          course,
          assignment,
          type,
          score,
          maxScore,
          weight: weight || 1,
          comments,
          gradedBy: user.id,
          isPublished,
          publishedAt: isPublished ? Date.now() : undefined
        });
        
        isBeingPublished = isPublished;
      }
      
      results.push({
        student,
        success: true,
        data: grade
      });
      
      // If grade is being published, add notification to queue
      if (isBeingPublished) {
        // Add notification for student
        notifications.push({
          recipient: student,
          sender: user.id,
          type: 'grade',
          title: 'New Grade Posted',
          message: `A new grade has been posted for ${courseDoc.name}: ${type}`,
          relatedResource: {
            resourceType: 'grade',
            resourceId: grade._id
          },
          priority: 'high'
        });
        
        // Find student's parents for notification
        const studentDoc = await User.findById(student);
        const parentIds = studentDoc.studentDetails?.parentIds || [];
        
        parentIds.forEach(parentId => {
          notifications.push({
            recipient: parentId,
            sender: user.id,
            type: 'grade',
            title: 'New Grade Posted',
            message: `A new grade has been posted for ${studentDoc.firstName} ${studentDoc.lastName} in ${courseDoc.name}: ${type}`,
            relatedResource: {
              resourceType: 'grade',
              resourceId: grade._id
            },
            priority: 'high'
          });
        });
      }
    } catch (err) {
      results.push({
        student,
        success: false,
        message: err.message
      });
    }
  }
  
  // Send notifications asynchronously
  if (notifications.length > 0) {
    process.nextTick(async () => {
      for (const notification of notifications) {
        try {
          await Notification.createNotification(notification);
        } catch (err) {
          console.error('Failed to send notification:', err);
        }
      }
    });
  }
  
  return results;
};
