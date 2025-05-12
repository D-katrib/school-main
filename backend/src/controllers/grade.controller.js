const gradeService = require('../services/grade.service');

/**
 * @desc    Get grades
 * @route   GET /api/grades
 * @access  Private
 */
exports.getGrades = async (req, res, next) => {
  try {
    const result = await gradeService.getGrades(req.query, req.user);
    
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
 * @desc    Get course grade summary for a student
 * @route   GET /api/grades/summary
 * @access  Private
 */
exports.getGradeSummary = async (req, res, next) => {
  try {
    const summary = await gradeService.getGradeSummary(req.query, req.user);
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Record grade
 * @route   POST /api/grades
 * @access  Private/Admin,Teacher
 */
exports.recordGrade = async (req, res, next) => {
  try {
    const gradeResult = await gradeService.recordGrade(req.body, req.user);
    
    res.status(gradeResult.isNew ? 201 : 200).json({
      success: true,
      data: gradeResult.grade
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Bulk record grades
 * @route   POST /api/grades/bulk
 * @access  Private/Admin,Teacher
 */
exports.bulkRecordGrades = async (req, res, next) => {
  try {
    const results = await gradeService.bulkRecordGrades(req.body, req.user);
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    next(err);
  }
};
