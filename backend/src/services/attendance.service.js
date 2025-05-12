const Attendance = require('../models/attendance.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');

/**
 * Get attendance records with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @param {Object} user - Current user object
 * @returns {Object} Attendance records and pagination data
 */
exports.getAttendanceRecords = async (queryParams, user) => {
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
  query = Attendance.find(JSON.parse(queryStr));
  
  // Role-based filtering
  if (user.role === 'student') {
    // Students can only see their own attendance
    query = query.find({ student: user.id });
  } else if (user.role === 'teacher') {
    // Teachers can only see attendance for courses they teach
    const courses = await Course.find({ teacher: user.id }).select('_id');
    const courseIds = courses.map(course => course._id);
    query = query.find({ course: { $in: courseIds } });
  } else if (user.role === 'parent') {
    // Parents can see attendance for their children
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    query = query.find({ student: { $in: studentIds } });
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
    query = query.sort('-date');
  }
  
  // Get total count for pagination
  const total = await Attendance.countDocuments(query.getQuery());
  
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
    path: 'recordedBy',
    select: 'firstName lastName'
  });
  
  // Executing query
  const attendanceRecords = await query;
  
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
    count: attendanceRecords.length,
    pagination,
    data: attendanceRecords
  };
};

/**
 * Get attendance statistics
 * @param {Object} params - Parameters for statistics (studentId, courseId)
 * @param {Object} user - Current user object
 * @returns {Object} Attendance statistics
 */
exports.getAttendanceStats = async (params, user) => {
  const { studentId, courseId } = params;
  
  // Role-based access control
  if (user.role === 'student') {
    // Students can only see their own stats
    if (studentId && studentId !== user.id) {
      const error = new Error('Not authorized to access this student\'s attendance');
      error.statusCode = 403;
      throw error;
    }
    
    const stats = await Attendance.getStudentStats(user.id, courseId);
    return stats;
  } else if (user.role === 'parent') {
    // Parents can only see their children's stats
    if (!studentId) {
      const error = new Error('Student ID is required');
      error.statusCode = 400;
      throw error;
    }
    
    const parent = await User.findById(user.id);
    const studentIds = parent.parentDetails?.studentIds || [];
    
    if (!studentIds.includes(studentId)) {
      const error = new Error('Not authorized to access this student\'s attendance');
      error.statusCode = 403;
      throw error;
    }
    
    const stats = await Attendance.getStudentStats(studentId, courseId);
    return stats;
  } else if (user.role === 'teacher') {
    // Teachers can see course stats for courses they teach
    if (!courseId) {
      const error = new Error('Course ID is required');
      error.statusCode = 400;
      throw error;
    }
    
    const course = await Course.findById(courseId);
    
    if (!course || course.teacher.toString() !== user.id) {
      const error = new Error('Not authorized to access this course\'s attendance');
      error.statusCode = 403;
      throw error;
    }
    
    if (studentId) {
      // Get stats for specific student in course
      const stats = await Attendance.getStudentStats(studentId, courseId);
      return stats;
    } else {
      // Get stats for all students in course
      const stats = await Attendance.getCourseStats(courseId);
      return stats;
    }
  } else if (user.role === 'admin') {
    // Admins can see all stats
    if (studentId && courseId) {
      // Get stats for specific student in course
      const stats = await Attendance.getStudentStats(studentId, courseId);
      return stats;
    } else if (studentId) {
      // Get stats for specific student across all courses
      const stats = await Attendance.getStudentStats(studentId);
      return stats;
    } else if (courseId) {
      // Get stats for all students in course
      const stats = await Attendance.getCourseStats(courseId);
      return stats;
    } else {
      const error = new Error('Student ID or Course ID is required');
      error.statusCode = 400;
      throw error;
    }
  }
};

/**
 * Record attendance
 * @param {Object} attendanceData - Attendance data
 * @param {Object} user - Current user object
 * @returns {Object} Attendance record
 */
exports.recordAttendance = async (attendanceData, user) => {
  const { student, course, date, status, lateMinutes, excuseReason, excuseDocumentUrl, notes } = attendanceData;
  
  // Check if course exists and user is authorized
  const courseDoc = await Course.findById(course);
  
  if (!courseDoc) {
    const error = new Error(`Course not found with id of ${course}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user is course teacher or admin
  if (user.role === 'teacher' && courseDoc.teacher.toString() !== user.id) {
    const error = new Error('Not authorized to record attendance for this course');
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
  
  // Check if attendance record already exists
  const existingRecord = await Attendance.findOne({
    student,
    course,
    date: new Date(date)
  });
  
  let attendanceRecord;
  
  if (existingRecord) {
    // Update existing record
    existingRecord.status = status;
    existingRecord.lateMinutes = lateMinutes || 0;
    existingRecord.excuseReason = excuseReason;
    existingRecord.excuseDocumentUrl = excuseDocumentUrl;
    existingRecord.notes = notes;
    existingRecord.recordedBy = user.id;
    
    attendanceRecord = await existingRecord.save();
  } else {
    // Create new record
    attendanceRecord = await Attendance.create({
      student,
      course,
      date: new Date(date),
      status,
      lateMinutes: lateMinutes || 0,
      excuseReason,
      excuseDocumentUrl,
      notes,
      recordedBy: user.id
    });
    
    // If student is absent or late, send notification
    if (status === 'absent' || status === 'late') {
      // Notify student
      await Notification.createNotification({
        recipient: student,
        sender: user.id,
        type: 'attendance',
        title: `Attendance: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `You were marked as ${status} for ${courseDoc.name} on ${new Date(date).toLocaleDateString()}`,
        relatedResource: {
          resourceType: 'attendance',
          resourceId: attendanceRecord._id
        },
        priority: 'normal'
      });
      
      // Find student's parents and notify them
      const studentDoc = await User.findById(student);
      const parentIds = studentDoc.studentDetails?.parentIds || [];
      
      parentIds.forEach(async (parentId) => {
        await Notification.createNotification({
          recipient: parentId,
          sender: user.id,
          type: 'attendance',
          title: `Attendance: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `${studentDoc.firstName} ${studentDoc.lastName} was marked as ${status} for ${courseDoc.name} on ${new Date(date).toLocaleDateString()}`,
          relatedResource: {
            resourceType: 'attendance',
            resourceId: attendanceRecord._id
          },
          priority: 'high'
        });
      });
    }
  }
  
  return attendanceRecord;
};

/**
 * Bulk record attendance
 * @param {Object} bulkData - Bulk attendance data
 * @param {Object} user - Current user object
 * @returns {Array} Array of results
 */
exports.bulkRecordAttendance = async (bulkData, user) => {
  const { course, date, records } = bulkData;
  
  if (!course || !date || !records || !Array.isArray(records)) {
    const error = new Error('Please provide course, date, and records array');
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
    const error = new Error('Not authorized to record attendance for this course');
    error.statusCode = 403;
    throw error;
  }
  
  const attendanceDate = new Date(date);
  const results = [];
  const notifications = [];
  
  // Process each record
  for (const record of records) {
    const { student, status, lateMinutes, excuseReason, notes } = record;
    
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
      // Check if attendance record already exists
      const existingRecord = await Attendance.findOne({
        student,
        course,
        date: attendanceDate
      });
      
      let attendanceRecord;
      
      if (existingRecord) {
        // Update existing record
        existingRecord.status = status;
        existingRecord.lateMinutes = lateMinutes || 0;
        existingRecord.excuseReason = excuseReason;
        existingRecord.notes = notes;
        existingRecord.recordedBy = user.id;
        
        attendanceRecord = await existingRecord.save();
      } else {
        // Create new record
        attendanceRecord = await Attendance.create({
          student,
          course,
          date: attendanceDate,
          status,
          lateMinutes: lateMinutes || 0,
          excuseReason,
          notes,
          recordedBy: user.id
        });
      }
      
      results.push({
        student,
        success: true,
        data: attendanceRecord
      });
      
      // If student is absent or late, send notification
      if (status === 'absent' || status === 'late') {
        // Notify student
        await Notification.createNotification({
          recipient: student,
          sender: user.id,
          type: 'attendance',
          title: `Attendance: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `You were marked as ${status} for ${courseDoc.name} on ${attendanceDate.toLocaleDateString()}`,
          relatedResource: {
            resourceType: 'attendance',
            resourceId: attendanceRecord._id
          },
          priority: 'normal'
        });
        
        // Find student's parents and notify them
        const studentDoc = await User.findById(student);
        const parentIds = studentDoc.studentDetails?.parentIds || [];
        
        parentIds.forEach(async (parentId) => {
          await Notification.createNotification({
            recipient: parentId,
            sender: user.id,
            type: 'attendance',
            title: `Attendance: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `${studentDoc.firstName} ${studentDoc.lastName} was marked as ${status} for ${courseDoc.name} on ${attendanceDate.toLocaleDateString()}`,
            relatedResource: {
              resourceType: 'attendance',
              resourceId: attendanceRecord._id
            },
            priority: 'high'
          });
        });
      }
    } catch (error) {
      results.push({
        student,
        success: false,
        message: error.message
      });
    }
  }
  
  return results;
};
