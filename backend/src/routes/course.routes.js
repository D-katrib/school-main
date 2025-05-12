const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudents,
  unenrollStudents
} = require('../controllers/course.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - description
 *         - teacher
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the course
 *         name:
 *           type: string
 *           description: Course name
 *         code:
 *           type: string
 *           description: Course code
 *         description:
 *           type: string
 *           description: Course description
 *         teacher:
 *           type: string
 *           description: ID of the teacher for this course
 *         students:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of student IDs enrolled in the course
 *         startDate:
 *           type: string
 *           format: date
 *           description: Course start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Course end date
 *         isActive:
 *           type: boolean
 *           description: Whether the course is active
 *       example:
 *         id: 60d0fe4f5311236168a109cb
 *         name: Mathematics 101
 *         code: MATH101
 *         description: Introduction to basic mathematics concepts
 *         teacher: 60d0fe4f5311236168a109ca
 *         students: [60d0fe4f5311236168a109cc, 60d0fe4f5311236168a109cd]
 *         startDate: 2023-01-15
 *         endDate: 2023-05-30
 *         isActive: true
 */

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

// Apply protection to all routes
router.use(protect);

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: Get all courses
 *     description: Retrieve a list of all courses. Results are filtered based on user role.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacher
 *         schema:
 *           type: string
 *         description: Filter courses by teacher ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *         description: A list of courses
 *       401:
 *         description: Not authorized
 */
router.get('/', getCourses);

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get a course by ID
 *     description: Retrieve a course by its ID. Access is controlled based on user role.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
router.get('/:id', getCourse);

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course
 *     description: Create a new course. Only accessible by admins and teachers.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Course'
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authorize('admin', 'teacher'), createCourse);

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course
 *     description: Update a course by its ID. Only accessible by admins and the course teacher.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
router.put('/:id', authorize('admin', 'teacher'), updateCourse);

/**
 * @swagger
 * /courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     description: Delete a course by its ID. Only accessible by admins.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
router.delete('/:id', authorize('admin'), deleteCourse);

/**
 * @swagger
 * /courses/{id}/enroll:
 *   put:
 *     summary: Enroll students in a course
 *     description: Enroll multiple students in a course. Only accessible by admins and the course teacher.
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - students
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of student IDs to enroll
 *     responses:
 *       200:
 *         description: Students enrolled successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course not found
 */
router.put('/:id/enroll', authorize('admin', 'teacher'), enrollStudents);
router.put('/:id/unenroll', authorize('admin', 'teacher'), unenrollStudents);

module.exports = router;
