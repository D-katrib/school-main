const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a recipient']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'assignment', 
      'grade', 
      'attendance', 
      'announcement', 
      'message',
      'system'
    ],
    required: [true, 'Please add a notification type']
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Please add a message']
  },
  relatedResource: {
    resourceType: {
      type: String,
      enum: ['assignment', 'course', 'grade', 'attendance', 'user', 'submission']
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = Date.now();
  return this.save();
};

// Static method to create and send a notification
NotificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    
    // Here you would emit a socket event to notify the client
    // This will be handled by the socket.io implementation in the server
    
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    throw err;
  }
};

// Static method to get unread notifications count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

module.exports = mongoose.model('Notification', NotificationSchema);
