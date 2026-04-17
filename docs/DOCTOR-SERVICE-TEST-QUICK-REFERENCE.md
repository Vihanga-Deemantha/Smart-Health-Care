# Doctor Service API - Quick Test Reference

## 🚀 Quick Start (5 minutes)

### 1. Health Check
```bash
GET http://localhost:5029/health
```
✅ Expected: `200` with `"Doctor service running"`

### 2. Login & Get Token
```bash
POST http://localhost:5024/auth/login
Body: {
  "email": "dr.smith@hospital.com",
  "password": "SecurePassword123!"
}
```
✅ Copy `accessToken` → Set as `{{doctor_token}}` variable

### 3. Create/Update Profile
```bash
PATCH http://localhost:5029/api/doctors/{{doctor_id}}/profile
Header: Authorization: Bearer {{doctor_token}}
Body: {
  "specialties": ["Cardiology"],
  "consultationFee": 150,
  "qualifications": [
    {
      "title": "MD",
      "institution": "Harvard",
      "year": 2010
    }
  ]
}
```
✅ Expected: `200` with updated profile

---

## 📋 Complete Test Matrix

### Profile Endpoints

| Operation | Method | Endpoint | Auth? | Status |
|-----------|--------|----------|-------|--------|
| List doctors | GET | `/api/doctors` | No | 200 |
| Get doctor | GET | `/api/doctors/{id}` | No | 200 |
| Create doctor | POST | `/api/doctors` | No | 201 |
| Update profile | PATCH | `/api/doctors/{id}/profile` | Yes | 200 |
| Update availability | PATCH | `/api/doctors/{id}/availability` | Yes | 200 |

### Appointment Endpoints

| Operation | Method | Endpoint | Auth? | Status |
|-----------|--------|----------|-------|--------|
| Accept appointment | PATCH | `/api/appointments/{id}/respond` | Yes | 200 |
| Reject appointment | PATCH | `/api/appointments/{id}/respond` | Yes | 200 |
| Get telemedicine session | GET | `/api/appointments/{id}/telemedicine` | Yes | 200 |

### Prescription Endpoints

| Operation | Method | Endpoint | Auth? | Status |
|-----------|--------|----------|-------|--------|
| Issue prescription | POST | `/api/prescriptions` | Yes | 201 |
| List prescriptions | GET | `/api/prescriptions/patient/{patientId}` | Yes | 200 |

### Internal Endpoints

| Operation | Method | Endpoint | Internal Secret? | Status |
|-----------|--------|----------|-----------------|--------|
| Get all doctors | GET | `/internal/doctors` | Yes | 200 |
| Get doctor by ID | GET | `/internal/doctors/{id}` | Yes | 200 |

---

## 🔐 Authentication

### Headers Required
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Internal Service Header
```
x-internal-service-secret: super_internal_secret
```

---

## 📝 Request Templates

### Accept Appointment (Minimal)
```json
{
  "action": "ACCEPT"
}
```

### Reject Appointment (With Reason)
```json
{
  "action": "REJECT",
  "reason": "Schedule conflict"
}
```

### Update Profile (Full)
```json
{
  "hospitalId": "HOSP001",
  "contactNumber": "+1-555-0123",
  "consultationFee": 150,
  "specialties": ["Cardiology", "Emergency"],
  "bio": "Experienced cardiologist",
  "licenseNumber": "LIC123456789",
  "isAvailable": true,
  "qualifications": [
    {
      "title": "MD - Medicine",
      "institution": "Harvard Medical School",
      "year": 2010,
      "documentUrl": "https://example.com/md.pdf",
      "notes": "Primary qualification"
    }
  ]
}
```

### Update Availability (Full)
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
      "timezone": "UTC",
      "active": true
    },
    {
      "weekday": 2,
      "startHour": 10,
      "endHour": 18,
      "slotDurationMinutes": 45,
      "mode": "TELEMEDICINE",
      "bufferMinutes": 10,
      "timezone": "UTC",
      "active": true
    }
  ]
}
```

### Issue Prescription (Full)
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

---

## ✅ Expected Responses

### 200 OK - Success
```json
{
  "success": true,
  "message": "Doctor profile updated",
  "data": { /* response data */ }
}
```

### 201 Created
```json
{
  "success": true,
  "message": "Prescription issued",
  "data": {
    "prescription": { /* created object */ }
  }
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid action. action must be ACCEPT or REJECT",
  "code": "INVALID_REQUEST"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token is missing",
  "code": "UNAUTHORIZED"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Doctor not found",
  "code": "NOT_FOUND"
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Profile Setup (10 min)
1. ✅ Health check
2. ✅ Login (get token)
3. ✅ Create doctor profile
4. ✅ Update with qualifications
5. ✅ Set availability schedule
6. ✅ Get doctor details (verify all fields)

### Scenario 2: Appointment Flow (5 min)
1. ✅ Get appointment from appointment-service
2. ✅ Accept appointment
3. ✅ Verify status = CONFIRMED
4. ✅ Retrieve telemedicine link (if applicable)

### Scenario 3: Prescription Issue (3 min)
1. ✅ Create prescription with 3+ medicines
2. ✅ List prescriptions for patient
3. ✅ Verify medicine details

### Scenario 4: Permission Testing (5 min)
1. ✅ Request without JWT → expect 401
2. ✅ Request another doctor's data → expect 403
3. ✅ Request with invalid ID → expect 404

### Scenario 5: Qualifications Management (5 min)
1. ✅ Update with 1 qualification
2. ✅ Update with 3 qualifications
3. ✅ Verify all stored correctly
4. ✅ Update with empty array → should work

---

## 🔍 Validation Checklist

### Profile Endpoint
- [ ] Doctor ID is valid MongoDB ObjectId
- [ ] License number exists
- [ ] Specialties is non-empty array
- [ ] At least one qualification present
- [ ] Consultation fee ≥ 0
- [ ] `createdAt` and `updatedAt` timestamps exist

### Availability Endpoint
- [ ] Weekday 0-6 (0=Monday, 6=Sunday)
- [ ] Start hour 0-23
- [ ] End hour > start hour
- [ ] Slot duration 5-120 minutes
- [ ] Mode is IN_PERSON or TELEMEDICINE
- [ ] Buffer minutes 0-60

### Appointment Response
- [ ] Action is ACCEPT or REJECT
- [ ] If REJECT: reason is provided
- [ ] Appointment status changes appropriately
- [ ] Doctor's confirmation updated

### Prescription
- [ ] At least 1 medicine
- [ ] Each medicine has: name, dosage, frequency, duration, instructions
- [ ] Patient ID valid
- [ ] Appointment ID valid
- [ ] Doctor ID matches authenticated user

---

## 🐛 Debugging Tips

### Common Issues

**Problem**: 401 Unauthorized
```
Solution: 
1. Run Login endpoint first
2. Copy token from response
3. Set {{doctor_token}} variable
4. Refresh collection
```

**Problem**: 403 Forbidden
```
Solution:
1. Verify you're the doctor owner (check userId)
2. Verify role is DOCTOR
3. Try with different doctor account
```

**Problem**: 404 Not Found
```
Solution:
1. Check ID format (valid MongoDB ObjectId)
2. Verify ID exists in database
3. Query MongoDB directly to confirm
```

**Problem**: 409 Conflict
```
Solution:
1. Check if appointment is telemedicine (for /telemedicine endpoint)
2. Check if appointment is in correct status
3. Verify appointment hasn't already been responded to
```

### Enable Request Logging
1. Open Postman Console (Cmd/Ctrl + Alt + C)
2. Re-run request
3. View full request/response in console

---

## 📊 Performance Benchmarks

| Endpoint | Expected Time | Note |
|----------|---------------|------|
| Health check | <50ms | Local service |
| Get doctors | <100ms | No filter |
| Get doctor by ID | <50ms | Single document |
| Create doctor | <200ms | Includes DB write |
| Update profile | <150ms | DB update + validation |
| Accept appointment | <300ms | Proxies to appointment-service |
| Get telemedicine | <200ms | Upstream call |
| Issue prescription | <250ms | DB write + event publish |

---

## 🔗 URLs

```
Auth Service (Login):     http://localhost:5024
Doctor Service:           http://localhost:5029
Appointment Service:      http://localhost:5027
Patient Service:          http://localhost:5028
API Gateway:              http://localhost:5026
```

---

## 📚 Files References

- Postman Collection: `docs/Doctor-Service-API-Postman-Collection.json`
- Full Testing Guide: `docs/DOCTOR-SERVICE-TESTING-GUIDE.md`
- API Code: `backend/doctor-service/src/`
- Models: `backend/doctor-service/src/models/`
- Controllers: `backend/doctor-service/src/controllers/`
- Routes: `backend/doctor-service/src/routes/`

---

## 🎯 Quick Commands

### Via curl (Linux/Mac)
```bash
# Get all doctors
curl http://localhost:5029/api/doctors

# Get with token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5029/api/doctors/123

# POST request
curl -X POST http://localhost:5029/api/prescriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @prescription.json
```

### Via PowerShell
```powershell
# Get all doctors
$uri = "http://localhost:5029/api/doctors"
$response = Invoke-WebRequest -Uri $uri -UseBasicParsing
$response.Content | ConvertFrom-Json | ConvertTo-Json

# With token
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-WebRequest -Uri $uri -Headers $headers -UseBasicParsing
```

---

**Version**: 1.0  
**Last Updated**: April 15, 2026  
**Collection Ready**: ✅ Import in Postman now!
