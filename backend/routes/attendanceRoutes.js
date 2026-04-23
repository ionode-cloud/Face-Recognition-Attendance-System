const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// Punch endpoint — handles entry (1st punch) and exit (2nd punch) per day per roll number
router.post('/punch', attendanceController.punchAttendance);

// Delete ALL records — must be before /:id so "all" isn't treated as an ID
router.delete('/all', attendanceController.deleteAllAttendanceRecords);

// Standard CRUD
router.get('/', attendanceController.getAttendanceRecords);
router.post('/', attendanceController.addAttendanceRecord);
router.delete('/:id', attendanceController.deleteAttendanceRecord);

module.exports = router;
