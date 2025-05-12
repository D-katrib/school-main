const Notification = require('../models/notification.model');

/**
 * Get user notifications with filtering, sorting, and pagination
 * @param {Object} queryParams - Query parameters for filtering, sorting, and pagination
 * @param {Object} user - Current user object
 * @returns {Object} Notifications and pagination data
 */
exports.getNotifications = async (queryParams, user) => {
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
  query = Notification.find({
    ...JSON.parse(queryStr),
    recipient: user.id
  });
  
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
    query = query.sort('-createdAt');
  }
  
  // Get total count for pagination
  const total = await Notification.countDocuments({
    ...JSON.parse(queryStr),
    recipient: user.id
  });
  
  // Pagination
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  query = query.skip(startIndex).limit(limit);
  
  // Populate sender
  query = query.populate({
    path: 'sender',
    select: 'firstName lastName role'
  });
  
  // Executing query
  const notifications = await query;
  
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
    count: notifications.length,
    pagination,
    data: notifications
  };
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Object} Count of unread notifications
 */
exports.getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  });
  
  return { count };
};

/**
 * Create notification
 * @param {Object} notificationData - Notification data
 * @returns {Object} Created notification
 */
exports.createNotification = async (notificationData) => {
  const notification = await Notification.createNotification(notificationData);
  return notification;
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {Object} user - Current user object
 * @returns {Object} Updated notification
 */
exports.markAsRead = async (notificationId, user) => {
  const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    const error = new Error(`Notification not found with id of ${notificationId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user owns the notification
  if (notification.recipient.toString() !== user.id) {
    const error = new Error('Not authorized to update this notification');
    error.statusCode = 403;
    throw error;
  }
  
  notification.isRead = true;
  notification.readAt = Date.now();
  
  await notification.save();
  
  return notification;
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {boolean} True if successful
 */
exports.markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: Date.now() }
  );
  
  return true;
};

/**
 * Delete notification
 * @param {string} notificationId - Notification ID
 * @param {Object} user - Current user object
 * @returns {boolean} True if deleted
 */
exports.deleteNotification = async (notificationId, user) => {
  const notification = await Notification.findById(notificationId);
  
  if (!notification) {
    const error = new Error(`Notification not found with id of ${notificationId}`);
    error.statusCode = 404;
    throw error;
  }
  
  // Make sure user owns the notification
  if (notification.recipient.toString() !== user.id) {
    const error = new Error('Not authorized to delete this notification');
    error.statusCode = 403;
    throw error;
  }
  
  await notification.remove();
  return true;
};
