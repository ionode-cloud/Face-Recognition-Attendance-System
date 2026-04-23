const Attendance = require('../models/Attendance');

// GET /api/attendance - Fetch all records
exports.getAttendanceRecords = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Server error while fetching records' });
  }
};

// Helper function to parse time "HH:MM" into minutes from start of day
const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// POST /api/attendance - Add new record
exports.addAttendanceRecord = async (req, res) => {
  try {
    const { name, branch, date, time, classStartTime = "22:00" } = req.body;

    if (!name || !branch || !date || !time) {
      return res.status(400).json({ message: 'All fields (name, branch, date, time) are required' });
    }

    // Default assume present and not late
    let assignedAttendance = 'Present';
    let isLateEntry = false;

    // Calculate Late Entry Logic
    const entryTimeMinutes = parseTimeToMinutes(time);
    const classStartTimeMinutes = parseTimeToMinutes(classStartTime);

    // If entryTime > classStartTime + 30 mins -> Absent
    if (entryTimeMinutes > classStartTimeMinutes + 30) {
      assignedAttendance = 'Absent';
      isLateEntry = false; // It's strictly absent
    }
    // If entryTime > classStartTime + 10 mins and <= + 30 mins -> Present, Late
    else if (entryTimeMinutes > classStartTimeMinutes + 10 && entryTimeMinutes <= classStartTimeMinutes + 30) {
      assignedAttendance = 'Present';
      isLateEntry = true;
    }
    // If entryTime <= classStartTime + 10 mins -> Present, Not Late
    else {
      assignedAttendance = 'Present';
      isLateEntry = false;
    }

    const newRecord = new Attendance({
      name: name.trim(),
      branch: branch.trim(),
      date,
      time,
      classTime: classStartTime,
      attendance: assignedAttendance,
      lateEntry: isLateEntry
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({
      message: 'Attendance recorded successfully ✅',
      data: savedRecord,
      meta: {
        classStartTime,
        evaluatedLate: isLateEntry
      }
    });
  } catch (error) {
    console.error('Error saving attendance record:', error);
    res.status(500).json({ message: 'Server error while saving record' });
  }
};

// DELETE /api/attendance/:id - Delete a record
exports.deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await Attendance.findByIdAndDelete(id);
    
    if (!deletedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.status(200).json({ message: 'Record deleted successfully', data: deletedRecord });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ message: 'Server error while deleting record' });
  }
};
