const express = require('express');
const router = express.Router();
const enrollmentRequestController = require('../controllers/enrollment-request.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Routes for /api/enrollment-requests
router.route('/')
  .get(protect, authorize('student'), enrollmentRequestController.getMyEnrollmentRequests);

router.route('/:id')
  .put(protect, authorize('admin', 'teacher'), enrollmentRequestController.processEnrollmentRequest)
  .delete(protect, authorize('student'), enrollmentRequestController.cancelEnrollmentRequest);

module.exports = router;
