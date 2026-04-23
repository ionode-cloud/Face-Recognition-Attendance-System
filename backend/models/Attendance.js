const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  branch: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: String,   // stored as "YYYY-MM-DD"
    required: true,
  },
  entryTime: {
    type: String,   // "HH:MM" (24-hr) — recorded on first punch
    default: null,
  },
  exitTime: {
    type: String,   // "HH:MM" (24-hr) — recorded on second punch (after 1 hr)
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: ['Present', 'Late Present', 'Absent'],
    default: 'Absent',
  },
}, { timestamps: true });

// Compound unique index — one record per roll number per day
attendanceSchema.index({ rollNumber: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
