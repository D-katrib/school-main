const express = require('express');
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission
} = require('../controllers/assignment.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - course
 *         - dueDate
 *         - totalPoints
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the assignment
 *         title:
 *           type: string
 *           description: Assignment title
 *         description:
 *           type: string
 *           description: Assignment description
 *         course:
 *           type: string
 *           description: ID of the course this assignment belongs to
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Assignment due date and time
 *         totalPoints:
 *           type: number
 *           description: Maximum points for this assignment
 *         isPublished:
 *           type: boolean
 *           description: Whether the assignment is published to students
 *         allowLateSubmissions:
 *           type: boolean
 *           description: Whether late submissions are allowed
 *         latePenalty:
 *           type: number
 *           description: Percentage penalty for late submissions
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to assignment files/attachments
 *         createdBy:
 *           type: string
 *           description: ID of the teacher who created the assignment
 *       example:
 *         id: 60d0fe4f5311236168a109cd
 *         title: Algebra Homework 1
 *         description: Complete problems 1-10 in Chapter 3
 *         course: 60d0fe4f5311236168a109cb
 *         dueDate: 2023-02-15T23:59:59.999Z
 *         totalPoints: 100
 *         isPublished: true
 *         allowLateSubmissions: true
 *         latePenalty: 10
 *         createdBy: 60d0fe4f5311236168a109ca
 *     Submission:
 *       type: object
 *       required:
 *         - content
 *         - student
 *         - assignment
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the submission
 *         content:
 *           type: string
 *           description: Submission content/text
 *         student:
 *           type: string
 *           description: ID of the student who submitted
 *         assignment:
 *           type: string
 *           description: ID of the assignment
 *         submittedAt:
 *           type: string
 *           format: date-time
 *           description: Submission date and time
 *         isLate:
 *           type: boolean
 *           description: Whether the submission was late
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to submission files/attachments
 *         score:
 *           type: number
 *           description: Score awarded for the submission
 *         feedback:
 *           type: string
 *           description: Teacher feedback on the submission
 *         status:
 *           type: string
 *           enum: [submitted, graded]
 *           description: Status of the submission
 *       example:
 *         id: 60d0fe4f5311236168a109ce
 *         content: My homework submission
 *         student: 60d0fe4f5311236168a109cc
 *         assignment: 60d0fe4f5311236168a109cd
 *         submittedAt: 2023-02-14T20:30:00.000Z
 *         isLate: false
 *         score: 95
 *         feedback: Great work!
 *         status: graded
 */

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Assignment management endpoints
 */

// Apply protection to all routes
router.use(protect);

/**
 * @swagger
 * /assignments:
 *   get:
 *     summary: Get all assignments
 *     description: Retrieve a list of all assignments. Results are filtered based on user role.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by course ID
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
 *         description: A list of assignments
 *       401:
 *         description: Not authorized
 */
router.get('/', getAssignments);

/**
 * @swagger
 * /assignments/{id}:
 *   get:
 *     summary: Get an assignment by ID
 *     description: Retrieve an assignment by its ID. Access is controlled based on user role.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.get('/:id', getAssignment);

/**
 * @swagger
 * /assignments:
 *   post:
 *     summary: Create a new assignment
 *     description: Create a new assignment. Only accessible by admins and teachers.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assignment'
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authorize('admin', 'teacher'), createAssignment);

/**
 * @swagger
 * /assignments/{id}:
 *   put:
 *     summary: Update an assignment
 *     description: Update an assignment by its ID. Only accessible by admins and the course teacher.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               totalPoints:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *               allowLateSubmissions:
 *                 type: boolean
 *               latePenalty:
 *                 type: number
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.put('/:id', authorize('admin', 'teacher'), updateAssignment);

/**
 * @swagger
 * /assignments/{id}:
 *   delete:
 *     summary: Delete an assignment
 *     description: Delete an assignment by its ID. Only accessible by admins and the course teacher.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.delete('/:id', authorize('admin', 'teacher'), deleteAssignment);

/**
 * @swagger
 * /assignments/{id}/submissions:
 *   get:
 *     summary: Get all submissions for an assignment
 *     description: Retrieve all submissions for a specific assignment. Only accessible by admins and the course teacher.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: List of submissions
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.get('/:id/submissions', authorize('admin', 'teacher'), getSubmissions);

/**
 * @swagger
 * /assignments/submissions/{id}:
 *   put:
 *     summary: Grade a submission
 *     description: Grade a student's submission. Only accessible by admins and the course teacher.
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 description: Score awarded for the submission
 *               feedback:
 *                 type: string
 *                 description: Teacher feedback on the submission
 *               publishGrade:
 *                 type: boolean
 *                 description: Whether to publish the grade immediately
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Submission not found
 */
router.put('/submissions/:id', authorize('admin', 'teacher'), gradeSubmission);

// Student routes
router.post('/:id/submit', authorize('student'), submitAssignment);

module.exports = router;
