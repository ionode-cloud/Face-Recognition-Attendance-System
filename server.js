const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock attendance data
let attendanceRecords = [
  {
    _id: "1",
    name: "Jyotiranjan Behera",
    branch: "Computer Science",
    date: "2026-03-09",
    time: "09:30",
    attendance: "Present",
    createdAt: "2026-03-09T09:30:00.000Z"
  },
  {
    _id: "2",
    name: "Priya Patel",
    branch: "Electronics",
    date: "2026-03-09",
    time: "09:15",
    attendance: "Present",
    createdAt: "2026-03-09T09:15:00.000Z"
  },
  {
    _id: "3",
    name: "Rahul Sharma",
    branch: "Mechanical",
    date: "2026-03-09",
    time: "09:45",
    attendance: "Absent",
    createdAt: "2026-03-09T09:45:00.000Z"
  },
  {
    _id: "4",
    name: "Sneha Gupta",
    branch: "Computer Science",
    date: "2026-03-08",
    time: "10:00",
    attendance: "Present",
    createdAt: "2026-03-08T10:00:00.000Z"
  },
  {
    _id: "5",
    name: "Amit Kumar",
    branch: "Civil",
    date: "2026-03-08",
    time: "09:20",
    attendance: "Absent",
    createdAt: "2026-03-08T09:20:00.000Z"
  },{
    _id: "1",
    name: "Jyotiranjan Behera",
    branch: "Computer Science",
    date: "2026-03-09",
    time: "09:30",
    attendance: "Present",
    createdAt: "2026-03-09T09:30:00.000Z"
  },
  {
    _id: "2",
    name: "Priya Patel",
    branch: "Electronics",
    date: "2026-03-09",
    time: "09:15",
    attendance: "Present",
    createdAt: "2026-03-09T09:15:00.000Z"
  },
  {
    _id: "3",
    name: "Rahul Sharma",
    branch: "Mechanical",
    date: "2026-03-09",
    time: "09:45",
    attendance: "Absent",
    createdAt: "2026-03-09T09:45:00.000Z"
  },
  {
    _id: "4",
    name: "Sneha Gupta",
    branch: "Computer Science",
    date: "2026-03-08",
    time: "10:00",
    attendance: "Present",
    createdAt: "2026-03-08T10:00:00.000Z"
  },
  {
    _id: "5",
    name: "Amit Kumar",
    branch: "Civil",
    date: "2026-03-08",
    time: "09:20",
    attendance: "Absent",
    createdAt: "2026-03-08T09:20:00.000Z"
  }
];

// GET /api/attendance - Fetch all records
app.get('/api/attendance', (req, res) => {
  console.log('📊 GET /api/attendance - Fetched records');
  res.json(attendanceRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST /api/attendance - Add new record
app.post('/api/attendance', (req, res) => {
  const { name, branch, date, time, attendance } = req.body;
  
  if (!name || !branch || !date || !time || !attendance) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const newRecord = {
    _id: Date.now().toString(),
    name: name.trim(),
    branch: branch.trim(),
    date: new Date(date).toISOString().split('T')[0],
    time,
    attendance,
    createdAt: new Date().toISOString()
  };

  attendanceRecords.unshift(newRecord); // Add to beginning (newest first)
  
  console.log('✅ POST /api/attendance - New record added:', newRecord.name);
  res.status(201).json({
    message: 'Attendance recorded successfully ✅',
    data: newRecord
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    recordsCount: attendanceRecords.length 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API running on http://localhost:${PORT}`);
  console.log('📋 Endpoints:');
  console.log('   GET  /api/attendance');
  console.log('   POST /api/attendance');
  console.log('   GET  /api/health');
  console.log('📊 Sample data loaded:', attendanceRecords.length, 'records');
});
