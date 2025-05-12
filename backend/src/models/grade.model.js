const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
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
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  type: {
    type: String,
    enum: ['assignment', 'quiz', 'test', 'project', 'midterm', 'final', 'participation', 'other'],
    required: [true, 'Please add a grade type']
  },
  score: {
    type: Number,
    required: [true, 'Please add a score'],
    min: [0, 'Score cannot be negative']
  },
  maxScore: {
    type: Number,
    required: [true, 'Please add a maximum score'],
    min: [0, 'Maximum score cannot be negative']
  },
  percentage: {
    type: Number,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot be more than 100']
  },
  letterGrade: {
    type: String
  },
  weight: {
    type: Number,
    default: 1,
    min: [0, 'Weight cannot be negative']
  },
  comments: {
    type: String
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please add a grader']
  },
  gradedAt: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate percentage and letter grade before saving
GradeSchema.pre('save', function(next) {
  // Calculate percentage
  this.percentage = (this.score / this.maxScore) * 100;
  
  // Determine letter grade based on percentage
  if (this.percentage >= 90) {
    this.letterGrade = 'A';
  } else if (this.percentage >= 80) {
    this.letterGrade = 'B';
  } else if (this.percentage >= 70) {
    this.letterGrade = 'C';
  } else if (this.percentage >= 60) {
    this.letterGrade = 'D';
  } else {
    this.letterGrade = 'F';
  }
  
  // Set published date if being published
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  next();
});

// Compound index to ensure unique grade records per student per course per assignment
GradeSchema.index({ student: 1, course: 1, assignment: 1, type: 1 }, { unique: true });

// Static method to calculate course grade for a student
GradeSchema.statics.calculateCourseGrade = async function(studentId, courseId) {
  const grades = await this.find({
    student: studentId,
    course: courseId,
    isPublished: true
  });
  
  if (grades.length === 0) {
    return {
      totalScore: 0,
      totalMaxScore: 0,
      percentage: 0,
      letterGrade: 'N/A'
    };
  }
  
  let weightedScore = 0;
  let totalWeight = 0;
  
  grades.forEach(grade => {
    weightedScore += (grade.percentage * grade.weight);
    totalWeight += grade.weight;
  });
  
  const percentage = totalWeight > 0 ? weightedScore / totalWeight : 0;
  
  // Determine letter grade
  let letterGrade;
  if (percentage >= 90) {
    letterGrade = 'A';
  } else if (percentage >= 80) {
    letterGrade = 'B';
  } else if (percentage >= 70) {
    letterGrade = 'C';
  } else if (percentage >= 60) {
    letterGrade = 'D';
  } else {
    letterGrade = 'F';
  }
  
  return {
    percentage,
    letterGrade,
    totalGrades: grades.length
  };
};

module.exports = mongoose.model('Grade', GradeSchema);
