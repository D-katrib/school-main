const express = require('express');
const {
  getGrades,
  getGradeSummary,
  recordGrade,
  bulkRecordGrades
} = require('../controllers/grade.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Grade:
 *       type: object
 *       required:
 *         - student
 *         - course
 *         - type
 *         - name
 *         - score
 *         - maxScore
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the grade record
 *         student:
 *           type: string
 *           description: ID of the student
 *         course:
 *           type: string
 *           description: ID of the course
 *         type:
 *           type: string
 *           enum: [assignment, quiz, exam, project, participation, other]
 *           description: Type of the grade
 *         name:
 *           type: string
 *           description: Name/title of the graded item
 *         score:
 *           type: number
 *           description: Score achieved
 *         maxScore:
 *           type: number
 *           description: Maximum possible score
 *         weight:
 *           type: number
 *           description: Weight of this grade in the overall course grade calculation
 *         feedback:
 *           type: string
 *           description: Teacher feedback on the grade
 *         isPublished:
 *           type: boolean
 *           description: Whether the grade is visible to students
 *         recordedBy:
 *           type: string
 *           description: ID of the teacher who recorded the grade
 *         recordedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the grade was recorded
 *       example:
 *         id: 60d0fe4f5311236168a109d0
 *         student: 60d0fe4f5311236168a109cc
 *         course: 60d0fe4f5311236168a109cb
 *         type: assignment
 *         name: Homework 1
 *         score: 85
 *         maxScore: 100
 *         weight: 0.1
 *         isPublished: true
 *         recordedBy: 60d0fe4f5311236168a109ca
 *         recordedAt: 2023-02-15T14:30:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Grades
 *   description: Grade management endpoints
 */

// Apply protection to all routes
router.use(protect);

/**
 * @swagger
 * /grades:
 *   get:
 *     summary: Get grades
 *     description: Retrieve grades. Results are filtered based on user role.
 *     tags: [Grades]
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assignment, quiz, exam, project, participation, other]
 *         description: Filter by grade type
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter by published status
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
 *         description: A list of grades
 *       401:
 *         description: Not authorized
 */
router.get('/', getGrades);

/**
 * @swagger
 * /grades/summary:
 *   get:
 *     summary: Get grade summary
 *     description: Retrieve grade summaries for courses or students. Results are filtered based on user role.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *         description: Get summary for a specific student
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Get summary for a specific course
 *     responses:
 *       200:
 *         description: Grade summary
 *       401:
 *         description: Not authorized
 */
router.get('/summary', getGradeSummary);

/**
 * @swagger
 * /grades:
 *   post:
 *     summary: Record a grade
 *     description: Record a grade for a student in a course. Only accessible by admins and teachers.
 *     tags: [Grades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Grade recorded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authorize('admin', 'teacher'), recordGrade);

/**
 * @swagger
 * /grades/bulk:
 *   post:
 *     summary: Record grades in bulk
 *     description: Record grades for multiple students in a course. Only accessible by admins and teachers.
 *     tags: [Grades]
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
 *               - type
 *               - name
 *               - maxScore
 *               - grades
 *             properties:
 *               course:
 *                 type: string
 *                 description: ID of the course
 *               type:
 *                 type: string
 *                 enum: [assignment, quiz, exam, project, participation, other]
 *                 description: Type of the grade
 *               name:
 *                 type: string
 *                 description: Name/title of the graded item
 *               maxScore:
 *                 type: number
 *                 description: Maximum possible score
 *               weight:
 *                 type: number
 *                 description: Weight in overall grade calculation
 *               isPublished:
 *                 type: boolean
 *                 description: Whether to publish grades immediately
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - student
 *                     - score
 *                   properties:
 *                     student:
 *                       type: string
 *                       description: ID of the student
 *                     score:
 *                       type: number
 *                       description: Score achieved
 *                     feedback:
 *                       type: string
 *                       description: Individual feedback
 *     responses:
 *       201:
 *         description: Bulk grades recorded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/bulk', authorize('admin', 'teacher'), bulkRecordGrades);

module.exports = router;
