const Attendance = require('../models/Attendance');

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert "HH:MM" string to total minutes since midnight */
const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/** Return today's date as "YYYY-MM-DD" in IST (UTC+5:30) */
const todayIST = () => {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
};

/** Determine status based on entry time (HH:MM, 24-hr) */
const calcStatus = (entryTime) => {
  const mins = toMinutes(entryTime);
  const T10  = 10 * 60;   // 10:00 AM in minutes
  const T11  = 11 * 60;   // 11:00 AM in minutes

  if (mins >= T10 && mins <= T11) return 'Present';
  if (mins > T11)                  return 'Late Present';
  // Punched before 10:00 AM — treat as Present (arrived early)
  return 'Present';
};

// ─── GET /api/attendance ─────────────────────────────────────────────────────
exports.getAttendanceRecords = async (req, res) => {
  try {
    const records = await Attendance.find().sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ message: 'Server error while fetching records' });
  }
};

// ─── POST /api/attendance/punch ───────────────────────────────────────────────
/**
 * Punch endpoint — handles both entry & exit for a given roll number.
 *
 * Body: { rollNumber, name, branch, time }
 *   time — current time in "HH:MM" (24-hr) sent by the face-recognition client
 *
 * Behaviour:
 *  • No record today  → create with entryTime, compute status
 *  • Record exists, no exitTime, ≥ 1 hr since entry → set exitTime
 *  • Record exists, no exitTime, < 1 hr since entry  → reject with 409
 *  • Record exists, exitTime already set             → reject with 409
 */
exports.punchAttendance = async (req, res) => {
  try {
    const { rollNumber, name, branch, time } = req.body;

    if (!rollNumber || !name || !branch || !time) {
      return res.status(400).json({
        message: 'All fields (rollNumber, name, branch, time) are required.',
      });
    }

    const date = todayIST();

    // ── Look for an existing record today ──────────────────────────────────
    let record = await Attendance.findOne({ rollNumber: rollNumber.trim(), date });

    if (!record) {
      // ── First punch → Entry ────────────────────────────────────────────
      const status = calcStatus(time);

      record = new Attendance({
        rollNumber: rollNumber.trim(),
        name: name.trim(),
        branch: branch.trim(),
        date,
        entryTime: time,
        exitTime: null,
        status,
      });

      await record.save();

      return res.status(201).json({
        message: `Entry recorded ✅  Status: ${status}`,
        punch: 'entry',
        data: record,
      });
    }

    // ── Record exists ──────────────────────────────────────────────────────
    if (record.exitTime) {
      return res.status(409).json({
        message: 'Both entry and exit already recorded for today.',
        data: record,
      });
    }

    // ── Second punch → Exit (only if ≥ 1 hour since entry) ────────────────
    const entryMins  = toMinutes(record.entryTime);
    const currentMins = toMinutes(time);
    const elapsed     = currentMins - entryMins;   // minutes

    if (elapsed < 60) {
      return res.status(409).json({
        message: `Punch after 1 hour (Wait ${60 - elapsed} min more)`,
        eligibleAt: `${Math.floor((entryMins + 60) / 60).toString().padStart(2, '0')}:${((entryMins + 60) % 60).toString().padStart(2, '0')}`,
        data: record,
      });
    }

    record.exitTime = time;
    await record.save();

    return res.status(200).json({
      message: 'Exit recorded ✅',
      punch: 'exit',
      data: record,
    });
  } catch (error) {
    console.error('Error in punchAttendance:', error);
    res.status(500).json({ message: 'Server error while processing punch.' });
  }
};

// ─── POST /api/attendance (legacy / direct insert) ───────────────────────────
exports.addAttendanceRecord = async (req, res) => {
  try {
    const { rollNumber, name, branch, date, time } = req.body;

    if (!rollNumber || !name || !branch || !date || !time) {
      return res.status(400).json({
        message: 'All fields (rollNumber, name, branch, date, time) are required.',
      });
    }

    const status = calcStatus(time);

    const newRecord = new Attendance({
      rollNumber: rollNumber.trim(),
      name: name.trim(),
      branch: branch.trim(),
      date,
      entryTime: time,
      exitTime: null,
      status,
    });

    const saved = await newRecord.save();

    res.status(201).json({
      message: 'Attendance recorded successfully ✅',
      data: saved,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Attendance already recorded for this roll number today. Use /punch to update exit time.',
      });
    }
    console.error('Error saving attendance record:', error);
    res.status(500).json({ message: 'Server error while saving record.' });
  }
};

// ─── DELETE /api/attendance/:id ───────────────────────────────────────────────
exports.deleteAttendanceRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    res.status(200).json({ message: 'Record deleted successfully.', data: deleted });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ message: 'Server error while deleting record.' });
  }
};

// ─── DELETE /api/attendance/all ───────────────────────────────────────────────
exports.deleteAllAttendanceRecords = async (req, res) => {
  try {
    const result = await Attendance.deleteMany({});
    res.status(200).json({
      message: `All attendance records deleted successfully. (${result.deletedCount} records removed)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all attendance records:', error);
    res.status(500).json({ message: 'Server error while deleting all records.' });
  }
};
