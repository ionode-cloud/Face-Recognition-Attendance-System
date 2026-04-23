# Attendance System API Documentation

## Base URL
Local environment: `http://localhost:5000/api/attendance`

---

## 1. Get All Attendance Records
**Endpoint:** `GET /api/attendance`
**Description:** Fetches all attendance records sorted by creation date (newest first).

### Response
- **Status Code:** 200 OK
- **Content-Type:** `application/json`

```json
[
  {
    "_id": "64d...",
    "name": "Jyotiranjan Behera",
    "branch": "Computer Science",
    "date": "2026-03-09",
    "time": "09:30",
    "attendance": "Present",
    "lateEntry": false,
    "createdAt": "2026-03-09T09:30:00.000Z",
    "updatedAt": "2026-03-09T09:30:00.000Z"
  }
]
```

---

## 2. Add New Attendance Record (With Late Entry Logic)
**Endpoint:** `POST /api/attendance`
**Description:** Creates a new attendance record. It processes late entry mathematically against an optionally provided `classStartTime` (defaults to `22:00` / 10:00 PM if not specified).

### Logic Overview:
Given a generic class start time (e.g. `22:00`), the `time` parameter is measured against it:
- **On time:** If `time <= classStartTime + 10 mins`, `attendance: "Present"` and `lateEntry: false`.
- **Late (Grace period):** If `classStartTime + 10 mins < time <= classStartTime + 30 mins`, `attendance: "Present"` and `lateEntry: true`.
- **Absent:** If `time > classStartTime + 30 mins`, `attendance: "Absent"` and `lateEntry: false` (strictly absent).

### Request Payload (JSON)
```json
{
  "name": "Jyotiranjan Behera",
  "branch": "Computer Science",
  "date": "2026-04-09",
  "time": "22:05",
  "classStartTime": "22:00"
}
```
*Note: `classStartTime` is optional and will default to `"22:00"` if omitted.*

### Expected Responses

**1. On Time / Grace Period Late (201 Created)**
```json
{
  "message": "Attendance recorded successfully ✅",
  "data": {
    "name": "Jyotiranjan Behera",
    "branch": "Computer Science",
    "date": "2026-04-09",
    "time": "22:05",
    "attendance": "Present",
    "lateEntry": true,
    "_id": "65b...",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "meta": {
    "classStartTime": "22:00",
    "evaluatedLate": true
  }
}
```

**2. Bad Request - Missing Fields (400 Bad Request)**
```json
{
  "message": "All fields (name, branch, date, time) are required"
}
```

---

## 3. Server Health Check
**Endpoint:** `GET /api/health`
**Description:** A quick test endpoint to verify the backend acts normally.

### Response
- **Status Code:** 200 OK
```json
{
  "status": "OK",
  "timestamp": "2026-04-09T10:15:30.000Z",
  "service": "Attendance Backend API"
}
```

---

## 4. Delete Attendance Record
**Endpoint:** `DELETE /api/attendance/:id`
**Description:** Deletes a specific attendance record by its MongoDB Object ID.

### Example URL
`DELETE http://localhost:5000/api/attendance/64d1234abc56789def012345`

### Expected Responses

**1. Success (200 OK)**
```json
{
  "message": "Record deleted successfully",
  "data": {
    "_id": "64d1234abc56789def012345",
    "name": "Jyotiranjan Behera",
    "attendance": "Present"
  }
}
```

**2. Not Found (404 Not Found)**
```json
{
  "message": "Record not found"
}
```
