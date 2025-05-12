const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a student']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please add a course']
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    default: 'present',
    required: [true, 'Please add an attendance status']
  },
  lateMinutes: {
    type: Number,
    min: [0, 'Late minutes cannot be negative'],
    default: 0
  },
  excuseReason: {
    type: String
  },
  excuseDocumentUrl: {
    type: String
  },
  notes: {
    type: String
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a recorder']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
AttendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure unique attendance records per student per course per date
AttendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

// Static method to get attendance statistics for a student
AttendanceSchema.statics.getStudentStats = async function(studentId, courseId = null) {
  const match = { student: mongoose.Types.ObjectId(studentId) };
  
  if (courseId) {
    match.course = mongoose.Types.ObjectId(courseId);
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        lateDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        },
        excusedDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      attendanceRate: 0
    };
  }
  
  const result = stats[0];
  result.attendanceRate = ((result.presentDays + result.lateDays) / result.totalDays) * 100;
  
  return result;
};

// Static method to get attendance statistics for a course
AttendanceSchema.statics.getCourseStats = async function(courseId, date = null) {
  const match = { course: mongoose.Types.ObjectId(courseId) };
  
  if (date) {
    // Match the specific date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    match.date = { $gte: startDate, $lte: endDate };
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$date',
        totalStudents: { $sum: 1 },
        presentStudents: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        absentStudents: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        lateStudents: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        },
        excusedStudents: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Attendance', AttendanceSchema);
