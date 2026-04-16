# Doctor Service API - Postman Testing Guide

## Overview
This guide explains how to use the Postman collection for testing the Doctor Service microservice endpoints. The collection includes complete workflows, automated test cases, and environment variables for easy testing.

---

## Table of Contents
1. [Setup](#setup)
2. [Collection Structure](#collection-structure)
3. [Test Workflows](#test-workflows)
4. [Environment Variables](#environment-variables)
5. [Test Cases](#test-cases)
6. [Error Handling](#error-handling)

---

## Setup

### Prerequisites
- Postman installed ([Download here](https://www.postman.com/downloads/))
- Doctor Service running on `http://localhost:5029`
- Auth Service running on `http://localhost:5024`
- MongoDB database configured with real credentials

### Import Collection

1. **Via File**:
   - Open Postman → Click **Import**
   - Select `Doctor-Service-API-Postman-Collection.json`
   - Click **Import**

2. **Via URL** (if hosted):
   - Open Postman → Click **Import**
   - Paste collection URL
   - Click **Continue** → **Import**

### Configure Environment

1. In Postman, go to **Environments** (left sidebar)
2. Click the **+** icon to create a new environment
3. Name it `Doctor Service Local`
4. Set these variables:
   - `base_url`: `http://localhost:5024` (Auth Service)
   - `doctor_service_url`: `http://localhost:5029` (Doctor Service)
   - `doctor_token`: (auto-populated after login)
   - `doctor_id`: (auto-populated after login)
   - `patient_id`: (set manually from your database)
   - `appointment_id`: (set manually from your database)
5. Click **Save**
6. Select this environment from the dropdown

---

## Collection Structure

### 1. **Authentication**
   - **Register Doctor**: Create a new doctor account
   - **Login Doctor**: Get JWT token (auto-stores in `doctor_token` variable)

### 2. **Doctor Profile Management**
   - **Get All Doctors**: List all doctors with filters
   - **Get Doctor by ID**: Retrieve specific doctor details
   - **Create Doctor**: Register a new doctor in the system
   - **Update Doctor Profile**: Modify qualifications, specialties, fees, etc.

### 3. **Doctor Availability Management**
   - **Update Availability Schedule**: Set working hours and consultation modes

### 4. **Appointment Response Management**
   - **Accept Appointment**: Doctor accepts a pending appointment
   - **Reject Appointment**: Doctor rejects with reason

### 5. **Telemedicine Sessions**
   - **Get Telemedicine Session Details**: Fetch meeting link and session info

### 6. **Prescription Management**
   - **Issue Prescription**: Create prescription for patient
   - **List Patient Prescriptions**: View all prescriptions for a patient

### 7. **Patient Reports**
   - **Get Patient Reports**: Access patient medical records

### 8. **Internal Service Endpoints**
   - **Get All Doctors (Internal)**: For inter-service communication
   - **Get Doctor by ID (Internal)**: Fetch doctor details with internal secret

### 9. **Health Check**
   - **Service Health**: Verify service is running

---

## Test Workflows

### Workflow 1: Complete Doctor Profile Setup
**Goal**: Create a complete doctor profile with qualifications and availability

**Steps**:
1. ✅ Run **Authentication → Login Doctor** (stores JWT)
2. ✅ Run **Doctor Profile Management → Create Doctor** (with qualifications)
3. ✅ Run **Doctor Availability Management → Update Availability Schedule**
4. ✅ Run **Doctor Profile Management → Get Doctor by ID** (verify all fields)

**Expected Results**:
- Doctor created with license number, specialties, and qualifications
- Availability slots saved for multiple weekdays
- Profile reflects all updated information

---

### Workflow 2: Appointment Response Flow
**Goal**: Doctor receives and responds to an appointment

**Prerequisites**:
- Valid `appointment_id` from appointment-service
- Authenticated doctor JWT token

**Steps**:
1. ✅ Run **Health Check → Service Health** (verify service running)
2. ✅ Run **Appointment Response Management → Accept Appointment**
3. ✅ Verify appointment status changed to CONFIRMED

**Or for rejection**:
1. ✅ Run **Appointment Response Management → Reject Appointment**
2. ✅ Verify appointment status changed to CANCELLED with reason

**Expected Results**:
- Status code 200
- Appointment status updated in database
- Patient receives notification (via appointment-service)

---

### Workflow 3: Telemedicine Session Access
**Goal**: Doctor retrieves telemedicine meeting details

**Prerequisites**:
- Telemedicine-mode appointment scheduled
- Authenticated doctor JWT

**Steps**:
1. ✅ Run **Telemedicine Sessions → Get Telemedicine Session Details**
2. ✅ Extract `meetingLink` from response
3. ✅ Share link with patient

**Expected Results**:
- Returns meeting link (Google Meet, Zoom, etc.)
- Session start/end times
- Provider information (Google Meet, Telemedicine Service, etc.)

---

### Workflow 4: Issue Prescription
**Goal**: Doctor creates prescription after appointment

**Prerequisites**:
- Completed appointment
- Valid `patient_id` and `appointment_id`
- Authenticated doctor JWT

**Steps**:
1. ✅ Run **Prescription Management → Issue Prescription**
2. ✅ Verify prescription saved with medicines
3. ✅ Run **Prescription Management → List Patient Prescriptions** (verify it appears)

**Expected Results**:
- Prescription created with medicines list
- Each medicine has dosage, frequency, duration, instructions
- Prescription appears in patient's prescription history

---

### Workflow 5: Update Qualifications
**Goal**: Doctor adds new certifications to profile

**Steps**:
1. ✅ Get current doctor details
2. ✅ Run **Doctor Profile Management → Update Doctor Profile**
3. ✅ Add new qualifications in the request body
4. ✅ Verify updated profile

**Example Qualifications**:
- MD from university
- Board certifications
- Specialized training courses
- Published research credentials

---

## Environment Variables

### Auto-Populated (After Login)
| Variable | Source | Usage |
|----------|--------|-------|
| `doctor_token` | Login response | Bearer token in Authorization header |
| `doctor_id` | Login response | Used in profile/appointment endpoints |

### Manually Set
| Variable | Source | Usage |
|----------|--------|-------|
| `patient_id` | Database query | For prescription/report endpoints |
| `appointment_id` | Appointment service | For appointment response/telemedicine |
| `base_url` | Auth service URL | Authentication endpoint base |
| `doctor_service_url` | Doctor service URL | All doctor service endpoints |

### Setting Manual Variables

1. Open Postman → Go to **Variables** tab (in collection)
2. Click on the variable you want to update
3. Enter the value from your database
4. Click **Save**

---

## Test Cases

### Test Case 1: Doctor Profile Creation & Validation

**Endpoint**: `POST /api/doctors`

**Request Body**:
```json
{
  "userId": "65d4a2f1c8e2a9b3d1234567",
  "licenseNumber": "LIC123456789",
  "specialties": ["Cardiology", "Internal Medicine"],
  "bio": "Experienced cardiologist",
  "hospitalId": "HOSP001",
  "contactNumber": "+1-555-0123",
  "consultationFee": 100,
  "isAvailable": true,
  "qualifications": [
    {
      "title": "MD - Medicine",
      "institution": "Harvard Medical School",
      "year": 2010,
      "documentUrl": "https://example.com/md.pdf"
    }
  ]
}
```

**Expected Status**: `201 Created`

**Assertions**:
- ✅ Response contains `_id` (MongoDB ObjectId)
- ✅ License number matches request
- ✅ Specialties array includes both entries
- ✅ Qualifications saved with all fields
- ✅ `createdAt` timestamp present

**Test Script**:
```javascript
pm.test('Doctor created with all fields', function() {
    var jsonData = pm.response.json();
    var doctor = jsonData.data.doctor;
    pm.expect(doctor).to.have.property('_id');
    pm.expect(doctor.licenseNumber).to.equal('LIC123456789');
    pm.expect(doctor.specialties).to.include('Cardiology');
    pm.expect(doctor.qualifications.length).to.be.greaterThan(0);
});
```

---

### Test Case 2: Update Profile with Qualifications

**Endpoint**: `PATCH /api/doctors/:id/profile`

**Request Body**:
```json
{
  "specialties": ["Cardiology", "Emergency Medicine"],
  "consultationFee": 150,
  "qualifications": [
    {
      "title": "MD - Medicine",
      "institution": "Harvard Medical School",
      "year": 2010,
      "documentUrl": "https://example.com/md.pdf"
    },
    {
      "title": "Board Certification",
      "institution": "American Board",
      "year": 2012,
      "documentUrl": "https://example.com/board.pdf"
    }
  ]
}
```

**Expected Status**: `200 OK`

**Assertions**:
- ✅ Response message includes "updated"
- ✅ Specialties array has both entries
- ✅ Consultation fee updated to 150
- ✅ Qualifications array has 2 entries
- ✅ `updatedAt` timestamp changed

---

### Test Case 3: Availability Schedule Management

**Endpoint**: `PATCH /api/doctors/:id/availability`

**Request Body**:
```json
{
  "availability": [
    {
      "weekday": 1,
      "startHour": 9,
      "endHour": 17,
      "slotDurationMinutes": 30,
      "mode": "IN_PERSON",
      "bufferMinutes": 5,
      "active": true
    },
    {
      "weekday": 2,
      "startHour": 10,
      "endHour": 18,
      "slotDurationMinutes": 45,
      "mode": "TELEMEDICINE",
      "bufferMinutes": 10,
      "active": true
    }
  ]
}
```

**Expected Status**: `200 OK`

**Assertions**:
- ✅ Availability array has 2 entries
- ✅ Each slot has valid weekday (0-6)
- ✅ Start/end hours are reasonable
- ✅ Slot duration between 5-120 minutes
- ✅ Mode is either IN_PERSON or TELEMEDICINE

---

### Test Case 4: Accept/Reject Appointment

**Endpoint**: `PATCH /api/appointments/:id/respond` (Doctor Service)

**Accept Request**:
```json
{
  "action": "ACCEPT"
}
```

**Reject Request**:
```json
{
  "action": "REJECT",
  "reason": "Schedule conflict due to emergency surgery"
}
```

**Expected Status**: `200 OK`

**Assertions**:
- ✅ Response message includes "response recorded"
- ✅ Appointment status changed to CONFIRMED (for accept)
- ✅ Appointment status changed to CANCELLED (for reject)
- ✅ Reason field is stored (for reject)
- ✅ Doctor's attendance confirmation updated

---

### Test Case 5: Get Telemedicine Session

**Endpoint**: `GET /api/appointments/:id/telemedicine`

**Expected Status**: `200 OK`

**Response**:
```json
{
  "success": true,
  "message": "Telemedicine session fetched",
  "data": {
    "session": {
      "appointmentId": "65d4a2f1c8e2a9b3d1234567",
      "meetingLink": "https://meet.google.com/xxx-yyyy-zzz",
      "provider": "GOOGLE_MEET",
      "calendarEventId": "event123@google.com",
      "startTime": "2024-04-20T10:00:00.000Z",
      "endTime": "2024-04-20T10:45:00.000Z"
    }
  }
}
```

**Assertions**:
- ✅ Meeting link is present and valid URL
- ✅ Provider is one of: GOOGLE_MEET, TELEMEDICINE_SERVICE, ZOOM
- ✅ Start/end times are ISO8601 format
- ✅ Start time is before end time
- ✅ Appointment is in CONFIRMED or BOOKED status

---

### Test Case 6: Issue Prescription

**Endpoint**: `POST /api/prescriptions`

**Request**:
```json
{
  "patientId": "65d4a2f1c8e2a9b3d1234567",
  "appointmentId": "65d4a2f1c8e2a9b3d1234568",
  "medicines": [
    {
      "name": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take in the morning with food"
    },
    {
      "name": "Atorvastatin",
      "dosage": "20mg",
      "frequency": "Once daily",
      "duration": "90 days",
      "instructions": "Take at bedtime"
    }
  ]
}
```

**Expected Status**: `201 Created`

**Assertions**:
- ✅ Prescription ID generated
- ✅ Medicines array has 2 entries
- ✅ Each medicine has all 5 fields
- ✅ Doctor ID matches authenticated user
- ✅ Patient ID is valid MongoDB ObjectId
- ✅ `issuedAt` timestamp present

---

### Test Case 7: Authorization & Authentication

**Test**: Missing JWT Token

**Endpoint**: `PATCH /api/doctors/:id/profile` (without Authorization header)

**Expected Status**: `401 Unauthorized`

**Expected Response**:
```json
{
  "success": false,
  "message": "Access token is missing",
  "code": "UNAUTHORIZED"
}
```

---

**Test**: Invalid JWT Token

**Endpoint**: `PATCH /api/doctors/:id/profile` (with invalid token)

**Expected Status**: `401 Unauthorized`

**Expected Response**:
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "code": "UNAUTHORIZED"
}
```

---

### Test Case 8: Internal Service Communication

**Endpoint**: `GET /internal/doctors` (without INTERNAL secret)

**Expected Status**: `401 Unauthorized`

---

**Endpoint**: `GET /internal/doctors` (with correct INTERNAL secret header)

**Header**: `x-internal-service-secret: super_internal_secret`

**Expected Status**: `200 OK`

**Returns**: Array of doctors (for appointment-service lookup)

---

## Error Handling

### Common Errors & Solutions

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| UNAUTHORIZED | 401 | Missing/invalid JWT | Login and get fresh token |
| FORBIDDEN | 403 | Doctor mismatch or role invalid | Ensure authenticated as target doctor |
| NOT_FOUND | 404 | Doctor/appointment doesn't exist | Verify ID exists in database |
| INVALID_ACTION | 400 | Action not "ACCEPT" or "REJECT" | Check appointment action field |
| APPOINTMENT_NOT_TELEMEDICINE | 409 | Appointment is IN_PERSON mode | Only telemedicine appointments have sessions |
| APPOINTMENT_NOT_FOUND | 404 | Appointment ID doesn't exist | Get valid appointment from appointment-service |

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "details": {}  // Optional additional info
}
```

---

## Running Full Test Suite

1. **Set Environment**: Select `Doctor Service Local` environment
2. **Run Collection**: 
   - Click **Doctor Service API** collection
   - Click **Run** button (play icon)
   - Select all requests
   - Click **Run Doctor Service API**
3. **View Results**:
   - Green = Passed
   - Red = Failed
   - Check **Console** (CMD/CTRL + ALT + C) for logs

---

## Tips & Best Practices

✅ **Do**:
- Always login first to get JWT token
- Keep MongoDB URIs sensitive; don't commit `.env` with real passwords
- Test health endpoint before other requests
- Use descriptive names for any data you create
- Check test script output for debugging

❌ **Don't**:
- Hardcode IDs; use variables
- Forget to update `patient_id` and `appointment_id` variables
- Use production credentials in Postman
- Run tests repeatedly on same data (reuse IDs)

---

## References

- [Doctor Service Code](../backend/doctor-service/)
- [API Documentation](./report.md)
- [Postman Docs](https://learning.postman.com/)

---

**Last Updated**: April 15, 2026
**Collection Version**: 1.0
