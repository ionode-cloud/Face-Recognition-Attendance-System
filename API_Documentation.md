# 📋 Face Recognition Attendance System — API Documentation

---

## 🌐 Base URLs

| Environment | URL |
|-------------|-----|
| **Local**   | `http://localhost:5000` |
| **Production** | `https://face-recognition-attendance-system-4evl.onrender.com` |

> All attendance endpoints are prefixed with `/api/attendance`

---

## 📐 Data Model (MongoDB Schema)

| Field        | Type     | Required | Description |
|--------------|----------|----------|-------------|
| `_id`        | ObjectId | Auto     | MongoDB auto-generated ID |
| `rollNumber` | String   | ✅ Yes   | Unique student ID (e.g. `"CS2101"`) |
| `name`       | String   | ✅ Yes   | Student full name |
| `branch`     | String   | ✅ Yes   | Department / branch |
| `date`       | String   | Auto     | Auto-set to today (`YYYY-MM-DD`) in IST |
| `entryTime`  | String   | Auto     | First punch time `HH:MM` — `null` until punched |
| `exitTime`   | String   | Auto     | Second punch time `HH:MM` — `null` until punched |
| `status`     | String   | Auto     | `"Present"` \| `"Late Present"` \| `"Absent"` |
| `createdAt`  | DateTime | Auto     | Mongoose timestamp |
| `updatedAt`  | DateTime | Auto     | Mongoose timestamp |

> **Unique Rule:** Only **one record** is allowed per `rollNumber` per `date`.

---

## 📌 Attendance Logic

### Entry Status Rules
| Punch Time | Status |
|------------|--------|
| 10:00 AM – 11:00 AM | ✅ `Present` |
| After 11:00 AM | ⏱ `Late Present` |
| No punch today | ❌ `Absent` |

### Exit Rules
| Condition | Result |
|-----------|--------|
| Punch again within 60 min of entry | ❌ Rejected (returns minutes left) |
| Punch again after 60 min of entry | ✅ Exit time recorded |
| Exit already recorded | ❌ Rejected |

---

---

# 🟢 GET — Fetch Attendance Records

---

## Endpoint 1 — Get All Records

```
GET /api/attendance
```

### How to use in Postman

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **URL** | `http://localhost:5000/api/attendance` |
| **Headers** | None required |
| **Body** | None |

### How to use with cURL
```bash
curl -X GET http://localhost:5000/api/attendance
```

### ✅ Response — 200 OK
```json
[
  {
    "_id": "64d1234abc56789def000001",
    "rollNumber": "CS2101",
    "name": "Jyotiranjan Behera",
    "branch": "Computer Science",
    "date": "2026-04-23",
    "entryTime": "10:25",
    "exitTime": "11:45",
    "status": "Present",
    "createdAt": "2026-04-23T04:55:00.000Z",
    "updatedAt": "2026-04-23T06:15:00.000Z"
  },
  {
    "_id": "64d1234abc56789def000002",
    "rollNumber": "EC2205",
    "name": "Priya Sharma",
    "branch": "Electronics",
    "date": "2026-04-23",
    "entryTime": "11:15",
    "exitTime": null,
    "status": "Late Present",
    "createdAt": "2026-04-23T05:45:00.000Z",
    "updatedAt": "2026-04-23T05:45:00.000Z"
  }
]
```

> Returns an **empty array `[]`** if no records exist — not an error.

---

---

# 🔵 POST — Create Attendance / Punch

---

## Endpoint 2 — Punch (Entry & Exit) ⭐ Primary Endpoint

```
POST /api/attendance/punch
```

**This is the main endpoint used by the face-recognition system.**

- **1st punch of the day** → Creates a new record with `entryTime` and calculates `status`
- **2nd punch of the day (after 1 hour)** → Updates `exitTime` on the existing record
- **Punching again after both are recorded** → Rejected with 409

### How to use in Postman

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `http://localhost:5000/api/attendance/punch` |
| **Headers** | `Content-Type: application/json` |
| **Body** | `raw → JSON` (see below) |

### Request Body
```json
{
  "rollNumber": "CS2101",
  "name": "Jyotiranjan Behera",
  "branch": "Computer Science",
  "time": "10:25"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `rollNumber` | String | ✅ | e.g. `"CS2101"` |
| `name` | String | ✅ | Student full name |
| `branch` | String | ✅ | Department name |
| `time` | String | ✅ | Current time as `"HH:MM"` in 24-hr format |

> `date` is **auto-set** to today's date in IST — do **not** send it.

### How to use with cURL
```bash
curl -X POST http://localhost:5000/api/attendance/punch \
  -H "Content-Type: application/json" \
  -d '{"rollNumber":"CS2101","name":"Jyotiranjan Behera","branch":"Computer Science","time":"10:25"}'
```

---

### ✅ Response — 201 Created (1st punch / Entry)
```json
{
  "message": "Entry recorded ✅  Status: Present",
  "punch": "entry",
  "data": {
    "_id": "64d1234abc56789def000001",
    "rollNumber": "CS2101",
    "name": "Jyotiranjan Behera",
    "branch": "Computer Science",
    "date": "2026-04-23",
    "entryTime": "10:25",
    "exitTime": null,
    "status": "Present",
    "createdAt": "2026-04-23T04:55:00.000Z",
    "updatedAt": "2026-04-23T04:55:00.000Z"
  }
}
```

### ✅ Response — 200 OK (2nd punch / Exit, after 1 hour)
```json
{
  "message": "Exit recorded ✅",
  "punch": "exit",
  "data": {
    "_id": "64d1234abc56789def000001",
    "rollNumber": "CS2101",
    "entryTime": "10:25",
    "exitTime": "11:45",
    "status": "Present",
    "updatedAt": "2026-04-23T06:15:00.000Z"
  }
}
```

### ❌ Response — 409 Conflict (Exit too early, < 1 hour since entry)
```json
{
  "message": "Exit not allowed yet. You need to wait 35 more minute(s) after entry.",
  "eligibleAt": "11:25",
  "data": { ... }
}
```

### ❌ Response — 409 Conflict (Both entry + exit already done)
```json
{
  "message": "Both entry and exit already recorded for today.",
  "data": { ... }
}
```

### ❌ Response — 400 Bad Request (Missing fields)
```json
{
  "message": "All fields (rollNumber, name, branch, time) are required."
}
```

---

## Endpoint 3 — Direct Insert (Admin / Manual Entry)

```
POST /api/attendance
```

Directly creates a record with a specific date. Useful for admin corrections or testing. Does **not** support the exit punch flow.

### How to use in Postman

| Field | Value |
|-------|-------|
| **Method** | `POST` |
| **URL** | `http://localhost:5000/api/attendance` |
| **Headers** | `Content-Type: application/json` |
| **Body** | `raw → JSON` (see below) |

### Request Body
```json
{
  "rollNumber": "ME3301",
  "name": "Ankit Patel",
  "branch": "Mechanical",
  "date": "2026-04-23",
  "time": "10:05"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `rollNumber` | String | ✅ | Student roll number |
| `name` | String | ✅ | Student name |
| `branch` | String | ✅ | Branch name |
| `date` | String | ✅ | `YYYY-MM-DD` format |
| `time` | String | ✅ | Entry time as `HH:MM` (24-hr) |

### How to use with cURL
```bash
curl -X POST http://localhost:5000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"rollNumber":"ME3301","name":"Ankit Patel","branch":"Mechanical","date":"2026-04-23","time":"10:05"}'
```

### ✅ Response — 201 Created
```json
{
  "message": "Attendance recorded successfully ✅",
  "data": {
    "_id": "64f...",
    "rollNumber": "ME3301",
    "name": "Ankit Patel",
    "branch": "Mechanical",
    "date": "2026-04-23",
    "entryTime": "10:05",
    "exitTime": null,
    "status": "Present",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### ❌ Response — 409 Conflict (Duplicate roll number on same date)
```json
{
  "message": "Attendance already recorded for this roll number today. Use /punch to update exit time."
}
```

### ❌ Response — 400 Bad Request (Missing fields)
```json
{
  "message": "All fields (rollNumber, name, branch, date, time) are required."
}
```

---

---

# 🟡 PUT — Update Exit Time

> The `/punch` endpoint (POST) already handles exit automatically.
> Use this endpoint only for **manual admin correction** of exit time.

```
PUT /api/attendance/:id
```

> ⚠️ **Note:** This route is for future/manual use. The recommended way to record exit is via `POST /api/attendance/punch`.

### How to use in Postman

| Field | Value |
|-------|-------|
| **Method** | `PUT` |
| **URL** | `http://localhost:5000/api/attendance/64d1234abc56789def000001` |
| **Headers** | `Content-Type: application/json` |
| **Body** | `raw → JSON` (see below) |

### Request Body
```json
{
  "exitTime": "14:30"
}
```

### How to use with cURL
```bash
curl -X PUT http://localhost:5000/api/attendance/64d1234abc56789def000001 \
  -H "Content-Type: application/json" \
  -d '{"exitTime":"14:30"}'
```

> ℹ️ **This route is not yet implemented.** To add it, create a controller method and add `router.put('/:id', ...)` in `attendanceRoutes.js`. The punch endpoint covers exit recording for all standard use cases.

---

---

# 🔴 DELETE — Remove a Record

---

## Endpoint 4 — Delete by ID

```
DELETE /api/attendance/:id
```

Permanently removes a single attendance record using its MongoDB `_id`.

### How to use in Postman

| Field | Value |
|-------|-------|
| **Method** | `DELETE` |
| **URL** | `http://localhost:5000/api/attendance/64d1234abc56789def000001` |
| **Headers** | None required |
| **Body** | None |

### How to use with cURL
```bash
curl -X DELETE http://localhost:5000/api/attendance/64d1234abc56789def000001
```

### ✅ Response — 200 OK
```json
{
  "message": "Record deleted successfully.",
  "data": {
    "_id": "64d1234abc56789def000001",
    "rollNumber": "CS2101",
    "name": "Jyotiranjan Behera",
    "branch": "Computer Science",
    "date": "2026-04-23",
    "entryTime": "10:25",
    "exitTime": "11:45",
    "status": "Present"
  }
}
```

### ❌ Response — 404 Not Found
```json
{
  "message": "Record not found."
}
```

---

---

# 💚 GET — Health Check

```
GET /api/health
```

Verifies the backend server is running and reachable.

### How to use in Postman

| Field | Value |
|-------|-------|
| **Method** | `GET` |
| **URL** | `http://localhost:5000/api/health` |
| **Headers** | None |
| **Body** | None |

### How to use with cURL
```bash
curl -X GET http://localhost:5000/api/health
```

### ✅ Response — 200 OK
```json
{
  "status": "OK",
  "timestamp": "2026-04-23T08:15:30.000Z",
  "service": "Attendance Backend API"
}
```

---

---

# 📊 All Endpoints Summary

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | `GET`    | `/api/attendance` | Fetch all records |
| 2 | `POST`   | `/api/attendance/punch` | ⭐ Entry / Exit punch |
| 3 | `POST`   | `/api/attendance` | Direct / admin insert |
| 4 | `PUT`    | `/api/attendance/:id` | Manual exit update *(future)* |
| 5 | `DELETE` | `/api/attendance/:id` | Delete a record |
| 6 | `GET`    | `/api/health` | Server health check |

---

# ⚠️ HTTP Status Code Reference

| Code | Meaning | When it occurs |
|------|---------|---------------|
| `200` | OK | Successful GET, exit punch, delete |
| `201` | Created | Entry punch or direct insert succeeded |
| `400` | Bad Request | Missing required fields in body |
| `404` | Not Found | ID does not exist (DELETE) |
| `409` | Conflict | Duplicate entry, exit too early, or already fully punched |
| `500` | Server Error | Unexpected error — check backend logs |
