const courseService = require('../services/course.service');

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private
 */
exports.getCourses = async (req, res, next) => {
  try {
    const result = await courseService.getCourses(req.query, req.user);
    
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
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
exports.getCourse = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private/Admin,Teacher
 */
exports.createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private/Admin,Teacher
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private/Admin
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Enroll students in course
 * @route   PUT /api/courses/:id/enroll
 * @access  Private/Admin,Teacher
 */
exports.enrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }
    
    const course = await courseService.enrollStudents(req.params.id, studentIds, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove students from course
 * @route   PUT /api/courses/:id/unenroll
 * @access  Private/Admin,Teacher
 */
exports.unenrollStudents = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of student IDs'
      });
    }
    
    const course = await courseService.unenrollStudents(req.params.id, studentIds, req.user);
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get course materials
 * @route   GET /api/courses/:id/materials
 * @access  Private
 */
exports.getCourseMaterials = async (req, res, next) => {
  try {
    const materials = await courseService.getCourseMaterials(req.params.id, req.user);
    
    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add course material
 * @route   POST /api/courses/:id/materials
 * @access  Private/Admin,Teacher
 */
exports.addCourseMaterial = async (req, res, next) => {
  try {
    const materialData = { ...req.body };
    
    // If a file was uploaded, add the file URL to the material data
    if (req.file) {
      const { getFileUrl } = require('../services/upload.service');
      materialData.url = getFileUrl(req, req.file.filename);
      materialData._fileUploaded = true; // Flag to indicate a file was uploaded
      
      // If no type is specified, try to determine it from the file extension
      if (!materialData.type) {
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        
        // Map common file extensions to material types
        const typeMap = {
          pdf: 'file',
          doc: 'file',
          docx: 'file',
          ppt: 'file',
          pptx: 'file',
          xls: 'file',
          xlsx: 'file',
          txt: 'text',
          mp4: 'video',
          mov: 'video',
          avi: 'video',
          mp3: 'file',
          jpg: 'file',
          jpeg: 'file',
          png: 'file',
          gif: 'file'
        };
        
        materialData.type = typeMap[fileExt] || 'file';
      }
      
      // Add original filename to description if not provided
      if (!materialData.description) {
        materialData.description = `Original filename: ${req.file.originalname}`;
      }
    }
    
    const course = await courseService.addCourseMaterial(req.params.id, materialData, req.user);
    
    res.status(201).json({
      success: true,
      data: course.materials[course.materials.length - 1]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove course material
 * @route   DELETE /api/courses/:id/materials/:materialId
 * @access  Private/Admin,Teacher
 */
exports.removeCourseMaterial = async (req, res, next) => {
  try {
    await courseService.removeCourseMaterial(req.params.id, req.params.materialId, req.user);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
