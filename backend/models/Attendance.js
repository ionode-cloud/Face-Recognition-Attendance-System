const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  classTime: {
    type: String,
    default: "22:00",
  },
  attendance: {
    type: String,
    required: true,
    enum: ['Present', 'Absent'],
  },
  lateEntry: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
