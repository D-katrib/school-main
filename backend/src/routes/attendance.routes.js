const express = require('express');
const {
  getAttendanceRecords,
  getAttendanceStats,
  recordAttendance,
  bulkRecordAttendance
} = require('../controllers/attendance.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Attendance:
 *       type: object
 *       required:
 *         - student
 *         - course
 *         - date
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the attendance record
 *         student:
 *           type: string
 *           description: ID of the student
 *         course:
 *           type: string
 *           description: ID of the course
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the attendance record
 *         status:
 *           type: string
 *           enum: [present, absent, late, excused]
 *           description: Attendance status
 *         notes:
 *           type: string
 *           description: Additional notes about the attendance
 *         recordedBy:
 *           type: string
 *           description: ID of the teacher who recorded the attendance
 *       example:
 *         id: 60d0fe4f5311236168a109cf
 *         student: 60d0fe4f5311236168a109cc
 *         course: 60d0fe4f5311236168a109cb
 *         date: 2023-02-15
 *         status: present
 *         recordedBy: 60d0fe4f5311236168a109ca
 */

/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management endpoints
 */

// Apply protection to all routes
router.use(protect);

/**
 * @swagger
 * /attendance:
 *   get:
 *     summary: Get attendance records
 *     description: Retrieve attendance records. Results are filtered based on user role.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [present, absent, late, excused]
 *         description: Filter by attendance status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (end)
 *       - in: query
 *         name: select
 *         schema:
 *           type: string
 *         description: Fields to select (comma-separated)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort fields (comma-separated)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: A list of attendance records
 *       401:
 *         description: Not authorized
 */
router.get('/', getAttendanceRecords);

/**
 * @swagger
 * /attendance/stats:
 *   get:
 *     summary: Get attendance statistics
 *     description: Retrieve attendance statistics for courses or students. Results are filtered based on user role.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *         description: Get stats for a specific student
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Get stats for a specific course
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (start)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date range (end)
 *     responses:
 *       200:
 *         description: Attendance statistics
 *       401:
 *         description: Not authorized
 */
router.get('/stats', getAttendanceStats);

/**
 * @swagger
 * /attendance:
 *   post:
 *     summary: Record attendance
 *     description: Record attendance for a student in a course. Only accessible by admins and teachers.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       201:
 *         description: Attendance recorded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authorize('admin', 'teacher'), recordAttendance);

/**
 * @swagger
 * /attendance/bulk:
 *   post:
 *     summary: Record attendance in bulk
 *     description: Record attendance for multiple students in a course. Only accessible by admins and teachers.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - course
 *               - date
 *               - records
 *             properties:
 *               course:
 *                 type: string
 *                 description: ID of the course
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of the attendance records
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - student
 *                     - status
 *                   properties:
 *                     student:
 *                       type: string
 *                       description: ID of the student
 *                     status:
 *                       type: string
 *                       enum: [present, absent, late, excused]
 *                       description: Attendance status
 *                     notes:
 *                       type: string
 *                       description: Additional notes
 *     responses:
 *       201:
 *         description: Bulk attendance recorded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/bulk', authorize('admin', 'teacher'), bulkRecordAttendance);

module.exports = router;
