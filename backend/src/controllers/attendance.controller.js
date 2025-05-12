const attendanceService = require('../services/attendance.service');

/**
 * @desc    Get attendance records
 * @route   GET /api/attendance
 * @access  Private
 */
exports.getAttendanceRecords = async (req, res, next) => {
  try {
    const result = await attendanceService.getAttendanceRecords(req.query, req.user);
    
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
 * @desc    Get attendance statistics
 * @route   GET /api/attendance/stats
 * @access  Private
 */
exports.getAttendanceStats = async (req, res, next) => {
  try {
    const stats = await attendanceService.getAttendanceStats(req.query, req.user);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Record attendance
 * @route   POST /api/attendance
 * @access  Private/Admin,Teacher
 */
exports.recordAttendance = async (req, res, next) => {
  try {
    const attendanceRecord = await attendanceService.recordAttendance(req.body, req.user);
    
    res.status(attendanceRecord.isNew ? 201 : 200).json({
      success: true,
      data: attendanceRecord.record
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk record attendance
 * @route   POST /api/attendance/bulk
 * @access  Private/Admin,Teacher
 */
exports.bulkRecordAttendance = async (req, res, next) => {
  try {
    const results = await attendanceService.bulkRecordAttendance(req.body, req.user);
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};
