const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/', attendanceController.getAttendanceRecords);
router.post('/', attendanceController.addAttendanceRecord);
router.delete('/:id', attendanceController.deleteAttendanceRecord);

module.exports = router;
