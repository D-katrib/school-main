const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    trim: true,
    maxlength: [100, 'Course name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add a course code'],
    unique: true,
    trim: true,
    maxlength: [20, 'Course code cannot be more than 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a teacher']
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  grade: {
    type: Number,
    required: [true, 'Please add a grade level'],
    min: [1, 'Grade level must be at least 1'],
    max: [100, 'Grade level cannot be more than 100']
  },
  academicYear: {
    type: String,
    required: [true, 'Please add an academic year']
  },
  semester: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    required: [true, 'Please add a semester']
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: [true, 'Please add a day']
    },
    startTime: {
      type: String,
      required: [true, 'Please add a start time']
    },
    endTime: {
      type: String,
      required: [true, 'Please add an end time']
    },
    room: {
      type: String,
      required: [true, 'Please add a room']
    }
  }],
  syllabus: {
    type: String
  },
  materials: [{
    title: {
      type: String,
      required: [true, 'Please add a title']
    },
    description: {
      type: String
    },
    type: {
      type: String,
      enum: ['file', 'video', 'link', 'text', 'other'],
      required: [true, 'Please specify the material type']
    },
    url: {
      type: String,
      required: [true, 'Please add a URL for the material']
    },
    content: {
      type: String,
      // For text content or additional information
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify who added this material']
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for assignments
CourseSchema.virtual('assignments', {
  ref: 'Assignment',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Virtual for attendance records
CourseSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

// Get average grade for course
CourseSchema.methods.getAverageGrade = async function() {
  const Grade = mongoose.model('Grade');
  
  const obj = await Grade.aggregate([
    {
      $match: { course: this._id }
    },
    {
      $group: {
        _id: '$course',
        averageGrade: { $avg: '$score' }
      }
    }
  ]);
  
  return obj[0] ? obj[0].averageGrade : 0;
};

module.exports = mongoose.model('Course', CourseSchema);
