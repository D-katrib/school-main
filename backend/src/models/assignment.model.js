const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please add a course']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  totalPoints: {
    type: Number,
    required: [true, 'Please add total points'],
    min: [0, 'Total points cannot be negative']
  },
  assignmentType: {
    type: String,
    enum: ['Homework', 'Quiz', 'Test', 'Project', 'Essay', 'Other'],
    default: 'Homework'
  },
  attachments: [{
    fileName: {
      type: String,
      required: [true, 'Please add a file name']
    },
    fileUrl: {
      type: String,
      required: [true, 'Please add a file URL']
    },
    fileType: {
      type: String
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    min: [0, 'Late penalty cannot be negative'],
    max: [100, 'Late penalty cannot be more than 100%'],
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a creator']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  submissionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission'
  }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update the updatedAt field on save
AssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for submissions
AssignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignment',
  justOne: false
});

// Get submission statistics
AssignmentSchema.methods.getSubmissionStats = async function() {
  const Submission = mongoose.model('Submission');
  
  const stats = await Submission.aggregate([
    {
      $match: { assignment: this._id }
    },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        averageScore: { $avg: '$score' },
        onTimeSubmissions: {
          $sum: {
            $cond: [
              { $lte: ['$submittedAt', this.dueDate] },
              1,
              0
            ]
          }
        },
        lateSubmissions: {
          $sum: {
            $cond: [
              { $gt: ['$submittedAt', this.dueDate] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalSubmissions: 0,
    averageScore: 0,
    onTimeSubmissions: 0,
    lateSubmissions: 0
  };
};

module.exports = mongoose.model('Assignment', AssignmentSchema);
