const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notification.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - recipient
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message content
 *         recipient:
 *           type: string
 *           description: ID of the user receiving the notification
 *         sender:
 *           type: string
 *           description: ID of the user sending the notification
 *         type:
 *           type: string
 *           enum: [assignment, grade, attendance, announcement, message, other]
 *           description: Type of notification
 *         relatedResource:
 *           type: object
 *           properties:
 *             resourceType:
 *               type: string
 *               enum: [course, assignment, grade, attendance]
 *             resourceId:
 *               type: string
 *           description: Related resource information
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the notification was created
 *       example:
 *         id: 60d0fe4f5311236168a109d1
 *         title: New Assignment
 *         message: A new assignment has been posted in your Math class
 *         recipient: 60d0fe4f5311236168a109cc
 *         sender: 60d0fe4f5311236168a109ca
 *         type: assignment
 *         relatedResource:
 *           resourceType: assignment
 *           resourceId: 60d0fe4f5311236168a109cd
 *         isRead: false
 *         createdAt: 2023-02-15T10:00:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

// Apply protection to all routes
router.use(protect);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get notifications
 *     description: Retrieve notifications for the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [assignment, grade, attendance, announcement, message, other]
 *         description: Filter by notification type
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
 *         description: A list of notifications
 *       401:
 *         description: Not authorized
 */
router.get('/', getNotifications);

/**
 * @swagger
 * /notifications/unread/count:
 *   get:
 *     summary: Get unread notification count
 *     description: Get the count of unread notifications for the authenticated user.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of unread notifications
 *       401:
 *         description: Not authorized
 */
router.get('/unread/count', getUnreadCount);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read', markAsRead);

/**
 * @swagger
 * /notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Mark all notifications for the authenticated user as read.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Not authorized
 */
router.put('/read-all', markAllAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     description: Delete a specific notification. Users can only delete their own notifications.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', deleteNotification);

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Create a notification
 *     description: Create a new notification. Only accessible by admins and teachers.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - recipient
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *               message:
 *                 type: string
 *                 description: Notification message content
 *               recipient:
 *                 type: string
 *                 description: ID of the user receiving the notification
 *               type:
 *                 type: string
 *                 enum: [assignment, grade, attendance, announcement, message, other]
 *                 description: Type of notification
 *               relatedResource:
 *                 type: object
 *                 properties:
 *                   resourceType:
 *                     type: string
 *                     enum: [course, assignment, grade, attendance]
 *                   resourceId:
 *                     type: string
 *                 description: Related resource information
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authorize('admin', 'teacher'), createNotification);

module.exports = router;
