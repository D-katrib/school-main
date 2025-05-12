const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Please add an assignment']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a student']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String
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
  score: {
    type: Number,
    min: [0, 'Score cannot be negative']
  },
  feedback: {
    type: String
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Set isLate flag before saving
SubmissionSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }
  
  try {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(this.assignment);
    
    if (assignment && this.submittedAt > assignment.dueDate) {
      this.isLate = true;
      
      // Apply late penalty if configured
      if (assignment.allowLateSubmissions && assignment.latePenalty > 0 && this.score) {
        const penaltyAmount = (this.score * assignment.latePenalty) / 100;
        this.score = Math.max(0, this.score - penaltyAmount);
      }
    }
    
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
