# Smart Health Care - Backend Microservices Documentation

## Overview
- Architecture: Node.js and Express microservices, MongoDB (Mongoose), REST via API gateway, RabbitMQ events, Redis/BullMQ jobs, and external integrations (Cloudinary, SMTP, Google Calendar, Notify.lk, Twilio).
- Scope: backend folder only; node_modules, coverage, dist, and package-lock.json excluded.
- Internal auth: x-internal-service-secret header for internal service calls.
- External services referenced but not in this repo: room-service (5030). The telemedicine-service directory exists but is empty.

## Service Inventory
| Service | Path | Port | Notes |
| --- | --- | --- | --- |
| api-gateway | backend/api-gateway | 5026 | Reverse proxy and rate limiting |
| auth-service | backend/auth-service | 5024 | Auth and internal admin APIs |
| admin-service | backend/admin-service | 5025 | Admin workflows and dashboard |
| ai-chatbot-service | backend/ai-chatbot-service | 5031 | Gemini based chat |
| patient-service | backend/patient-service | 5028 | Patient profile and reports |
| doctor-service | backend/doctor-service | 5029 | Doctor profiles, availability, prescriptions |
| notification-service | backend/notification-service | 5032 | RabbitMQ consumer with email/SMS/WhatsApp |
| appointment-service | backend/services/appointment-service | 5027 | Appointments, waitlist, feedback, emergency |
| payment-service | backend/services/payment-service | 5034 | Payments |
| telemedicine-service | backend/telemedicine-service | 5033 | Directory empty |

## admin-service
### Purpose
Admin workflows, user status updates, doctor approvals, security activity, and dashboard stats. Delegates user/admin data to auth-service.

### Packages
Dependencies:
- amqplib@^0.10.9
- axios@^1.14.0
- cors@^2.8.6
- dotenv@^17.4.1
- express@^5.2.1
- express-validator@^7.3.2
- helmet@^8.1.0
- jsonwebtoken@^9.0.3
- mongoose@^9.4.1
- morgan@^1.10.1

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
MONGODB_URI
JWT_ACCESS_SECRET
AUTH_SERVICE_URL
INTERNAL_SERVICE_SECRET
RABBITMQ_URL
RABBITMQ_EXCHANGE
```

### MongoDB schemas
- AdminAction
  - adminUserId: String (required)
  - targetUserId: String (required)
  - action: String (enum: DOCTOR_APPROVED, DOCTOR_REJECTED, DOCTOR_CHANGES_REQUESTED, ADMIN_CREATED, ADMIN_DELETED, USER_SUSPENDED, USER_ACTIVATED)
  - reason: String (optional)
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| GET | /api/admin/profile | JWT (ADMIN, SUPER_ADMIN) | Get current admin profile |
| PATCH | /api/admin/profile | JWT (ADMIN, SUPER_ADMIN) | Update current admin profile |
| POST | /api/admin/profile/photo | JWT (ADMIN, SUPER_ADMIN) | Upload admin profile photo |
| DELETE | /api/admin/profile/photo | JWT (ADMIN, SUPER_ADMIN) | Remove admin profile photo |
| PATCH | /api/admin/profile/password | JWT (ADMIN, SUPER_ADMIN) | Change admin password |
| GET | /api/admin/admins | JWT (SUPER_ADMIN) | List admins |
| POST | /api/admin/admins | JWT (SUPER_ADMIN) | Create admin |
| DELETE | /api/admin/admins/:id | JWT (SUPER_ADMIN) | Delete admin |
| GET | /api/admin/users | JWT (ADMIN, SUPER_ADMIN) | List users |
| GET | /api/admin/doctors/pending | JWT (ADMIN, SUPER_ADMIN) | List pending doctors |
| PATCH | /api/admin/doctors/:id/approve | JWT (ADMIN, SUPER_ADMIN) | Approve doctor |
| PATCH | /api/admin/doctors/:id/reject | JWT (ADMIN, SUPER_ADMIN) | Reject doctor |
| PATCH | /api/admin/users/:id/status | JWT (ADMIN, SUPER_ADMIN) | Update user status |
| GET | /api/admin/security/activity | JWT (ADMIN, SUPER_ADMIN) | Security activity feed |
| GET | /api/admin/actions | JWT (ADMIN, SUPER_ADMIN) | Admin actions feed |
| GET | /api/admin/dashboard/stats | JWT (ADMIN, SUPER_ADMIN) | Dashboard stats |

### Events
- Publishes: generic RabbitMQ publisher available (no hardcoded routing keys in admin-service).
- Consumes: none.

### Inter-service calls
- Calls auth-service internal endpoints via AUTH_SERVICE_URL and x-internal-service-secret.

---

## ai-chatbot-service
### Purpose
Generates AI chat responses using the Gemini API. Conversation context is kept in memory.

### Packages
Dependencies:
- @google/generative-ai@^0.24.1
- cors@^2.8.6
- dotenv@^17.4.1
- express@^5.2.1
- express-validator@^7.3.2
- helmet@^8.1.0
- jsonwebtoken@^9.0.3
- morgan@^1.10.1

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
JWT_ACCESS_SECRET
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_FALLBACK_MODELS
GEMINI_MAX_RETRIES
```

### MongoDB schemas
- None

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| POST | /api/ai/chat | JWT | Generate AI response |

---

## api-gateway
### Purpose
Reverse proxy for backend services with global rate limiting and JWT validation for protected routes.

### Packages
Dependencies:
- cors@^2.8.6
- dotenv@^17.4.1
- express@^5.2.1
- express-rate-limit@^8.3.2
- helmet@^8.1.0
- http-proxy-middleware@^3.0.5
- jsonwebtoken@^9.0.3
- morgan@^1.10.1

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
JWT_ACCESS_SECRET
AUTH_SERVICE_URL
ADMIN_SERVICE_URL
PATIENT_SERVICE_URL
AI_CHATBOT_SERVICE_URL
DOCTOR_SERVICE_URL
APPOINTMENT_SERVICE_URL
PAYMENT_SERVICE_URL
```

### MongoDB schemas
- None

### Routes (proxy)
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| ALL | /api/auth/* | No | Proxy to auth-service |
| ALL | /api/admin/* | JWT | Proxy to admin-service |
| ALL | /api/patients/* | JWT | Proxy to patient-service |
| ALL | /api/ai/* | JWT | Proxy to ai-chatbot-service |
| ALL | /api/doctors/* | No | Proxy to doctor-service |
| ALL | /api/prescriptions/* | JWT | Proxy to doctor-service |
| ALL | /api/feedback/doctors/* | No | Proxy to appointment-service |
| ALL | /api/emergency-resources/* | No | Proxy to appointment-service |
| ALL | /api/appointments/* | JWT | Proxy to appointment-service |
| ALL | /api/feedback/* | JWT | Proxy to appointment-service |
| ALL | /api/waitlist/* | JWT | Proxy to appointment-service |
| ALL | /api/emergency-alerts/* | JWT | Proxy to appointment-service |
| ALL | /api/notifications/* | JWT | Proxy to appointment-service |
| ALL | /api/payments/* | JWT | Proxy to payment-service |

---

## auth-service
### Purpose
User registration/login, JWT issuance, OTP verification, password reset, and internal admin APIs for admin-service.

### Packages
Dependencies:
- amqplib@^0.10.9
- bcryptjs@^3.0.3
- cloudinary@^2.9.0
- cookie-parser@^1.4.7
- cors@^2.8.6
- dotenv@^17.4.0
- express@^5.2.1
- express-validator@^7.3.2
- helmet@^8.1.0
- jsonwebtoken@^9.0.3
- mongoose@^9.4.1
- morgan@^1.10.1
- multer@^2.1.1
- nodemailer@^8.0.4

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
COOKIE_SECURE
MONGODB_URI
JWT_ACCESS_SECRET
JWT_ACCESS_EXPIRES
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES
INTERNAL_SERVICE_SECRET
OTP_RESEND_COOLDOWN_SECONDS
OTP_RATE_LIMIT_WINDOW_MINUTES
OTP_RATE_LIMIT_MAX
OTP_MAX_VERIFY_ATTEMPTS
OTP_ATTEMPT_BLOCK_MINUTES
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
EMAIL_FROM
RABBITMQ_URL
RABBITMQ_EXCHANGE
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_DOCTOR_DOCUMENTS_FOLDER
CLOUDINARY_ADMIN_PROFILE_PHOTOS_FOLDER
DOCTOR_DOCUMENT_MAX_FILE_SIZE_MB
ADMIN_PROFILE_PHOTO_MAX_FILE_SIZE_MB
```

### MongoDB schemas
- User
  - fullName: String
  - email: String (unique)
  - phone: String
  - jobTitle: String
  - profilePhoto: { url: String, publicId: String, uploadedAt: Date } or null
  - passwordHash: String
  - role: String (enum: PATIENT, DOCTOR, ADMIN, SUPER_ADMIN)
  - isEmailVerified: Boolean
  - accountStatus: String (enum: PENDING, ACTIVE, SUSPENDED, LOCKED)
  - identityType: String (enum: NIC, PASSPORT, null)
  - nic: String (unique, sparse)
  - passportNumber: String (unique, sparse)
  - nationality: String
  - doctorVerificationStatus: String (enum: NOT_REQUIRED, PENDING, APPROVED, CHANGES_REQUESTED, REJECTED)
  - medicalLicenseNumber: String
  - specialization: String
  - yearsOfExperience: Number
  - qualificationDocuments: [String]
  - verificationDocuments: [ { filename, url, publicId, mimeType, size, uploadedAt } ]
  - verificationLinks: [String]
  - doctorReviewedBy: ObjectId
  - doctorReviewedAt: Date
  - doctorRejectionReason: String
  - accountStatusChangedBy: ObjectId
  - accountStatusChangedAt: Date
  - accountStatusReason: String
  - failedLoginAttempts: Number
  - lockUntil: Date
  - lastLoginAt: Date
  - timestamps
- Otp
  - email: String
  - purpose: String (enum: EMAIL_VERIFY, PASSWORD_RESET)
  - otpCode: String
  - failedAttempts: Number
  - blockedUntil: Date
  - expiresAt: Date
  - used: Boolean
  - timestamps
- RefreshToken
  - userId: ObjectId (ref User)
  - tokenHash: String
  - expiresAt: Date
  - revoked: Boolean
  - timestamps
- AuthLog
  - userId: ObjectId (ref User, nullable)
  - email: String
  - action: String (enum: REGISTERED, LOGIN_SUCCESS, LOGIN_FAILED, PROFILE_VIEWED, OTP_SENT, OTP_VERIFIED, PASSWORD_RESET_REQUESTED, PASSWORD_RESET_SUCCESS, DOCTOR_VERIFICATION_RESUBMITTED, DOCTOR_APPROVED, DOCTOR_CHANGES_REQUESTED, ADMIN_CREATED, ADMIN_DELETED, ADMIN_PROFILE_UPDATED, ADMIN_PROFILE_PHOTO_UPDATED, ADMIN_PROFILE_PHOTO_REMOVED, ADMIN_PASSWORD_CHANGED, ACCOUNT_SUSPENDED, ACCOUNT_ACTIVATED)
  - ipAddress: String
  - userAgent: String
  - metadata: Object
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| POST | /api/auth/register/patient | No | Register patient |
| POST | /api/auth/register/doctor | No | Register doctor + verification docs |
| POST | /api/auth/doctor/verification/resubmit | JWT (DOCTOR) | Resubmit doctor verification |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/me | JWT | Get current user |
| POST | /api/auth/verify-email-otp | No | Verify email OTP |
| POST | /api/auth/resend-email-otp | No | Resend OTP |
| POST | /api/auth/forgot-password | No | Request password reset OTP |
| POST | /api/auth/reset-password | No | Reset password |
| POST | /api/auth/refresh-token | No (refresh cookie) | Rotate refresh token |
| POST | /api/auth/logout | No (refresh cookie) | Logout |
| GET | /internal/admin/admins/me | Internal | Get current admin profile |
| PATCH | /internal/admin/admins/me | Internal | Update admin profile |
| POST | /internal/admin/admins/me/photo | Internal | Upload admin profile photo |
| DELETE | /internal/admin/admins/me/photo | Internal | Remove admin profile photo |
| PATCH | /internal/admin/admins/me/password | Internal | Change admin password |
| GET | /internal/admin/admins | Internal | List admins |
| POST | /internal/admin/admins | Internal | Create admin |
| DELETE | /internal/admin/admins/:id | Internal | Delete admin |
| GET | /internal/admin/users | Internal | List users |
| GET | /internal/admin/auth-logs | Internal | Auth logs |
| GET | /internal/admin/doctors/pending | Internal | Pending doctors |
| PATCH | /internal/admin/doctors/:id/approve | Internal | Approve doctor |
| PATCH | /internal/admin/doctors/:id/reject | Internal | Reject doctor |
| PATCH | /internal/admin/users/:id/status | Internal | Update user status |
| GET | /internal/admin/dashboard/counts | Internal | Dashboard counts |

### Events
- Publishes (RabbitMQ):
  - notification.user.registered
  - notification.doctor.approved
  - notification.doctor.rejected
  - notification.account.suspended
  - notification.account.reactivated

---

## patient-service
### Purpose
Patient profile management, report uploads, appointment history, and prescription lookup.

### Packages
Dependencies:
- axios@^1.15.0
- cloudinary@^2.8.0
- cors@^2.8.6
- dotenv@^17.4.1
- express@^5.2.1
- express-validator@^7.3.2
- helmet@^8.1.0
- jsonwebtoken@^9.0.3
- mongoose@^9.4.1
- morgan@^1.10.1
- multer@^2.0.2

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
MONGODB_URI
JWT_ACCESS_SECRET
INTERNAL_SERVICE_SECRET
APPOINTMENT_SERVICE_URL
DOCTOR_SERVICE_URL
REPORT_MAX_FILE_SIZE_MB
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_REPORTS_FOLDER
```

### MongoDB schemas
- Patient
  - userId: String (unique)
  - email: String
  - fullName: String
  - dateOfBirth: Date
  - bloodGroup: String (enum: A+, A-, B+, B-, AB+, AB-, O+, O-)
  - contactNumber: String
  - address: String
  - allergies: [String]
  - reports: [ { filename, url, publicId, resourceType, mimeType, size, uploadDate } ]
  - medicalNotes: String
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| GET | /api/patients/profile | JWT (PATIENT) | Get patient profile |
| PUT | /api/patients/profile | JWT (PATIENT) | Update profile |
| POST | /api/patients/reports | JWT (PATIENT) | Upload report |
| GET | /api/patients/reports | JWT (PATIENT) | List reports |
| DELETE | /api/patients/reports | JWT (PATIENT) | Delete report |
| GET | /api/patients/history | JWT (PATIENT) | Appointment history |
| GET | /api/patients/prescriptions | JWT (PATIENT) | Prescriptions |
| GET | /internal/patients/:patientId | Internal | Internal patient profile |

### Inter-service calls
- Appointment history: APPOINTMENT_SERVICE_URL /api/appointments
- Prescriptions: DOCTOR_SERVICE_URL /api/prescriptions (falls back to appointment metadata)

---

## doctor-service
### Purpose
Doctor profiles, availability, appointment responses, patient report access, and prescriptions.

### Packages
Dependencies:
- cloudinary@^2.9.0
- cors@^2.8.6
- dotenv@^17.4.2
- express@^5.2.1
- express-validator@^7.3.2
- jsonwebtoken@^9.0.3
- mongoose@^9.4.1
- multer@^2.1.1

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
MONGODB_URI
MONGO_URI
JWT_ACCESS_SECRET
JWT_SECRET
INTERNAL_SERVICE_SECRET
PATIENT_SERVICE_URL
APPOINTMENT_SERVICE_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_DOCTOR_DOCUMENTS_FOLDER
CLOUDINARY_DOCTOR_PROFILE_PHOTOS_FOLDER
DOCTOR_DOCUMENT_MAX_FILE_SIZE_MB
DOCTOR_PROFILE_PHOTO_MAX_FILE_SIZE_MB
```

### MongoDB schemas
- Doctor
  - userId: ObjectId (ref User)
  - hospitalId: String
  - licenseNumber: String
  - specialties: [String]
  - availability: [ { weekday: Number, startHour: Number, endHour: Number, slotDurationMinutes: Number, mode: String, bufferMinutes: Number, timezone: String, active: Boolean } ]
  - contactNumber: String
  - address: String
  - consultationFee: Number
  - yearsOfExperience: Number
  - qualifications: [ { title, institution, year, documentUrl, notes } ]
  - bio: String
  - profilePhoto: String
  - isVerified: Boolean
  - isAvailable: Boolean
  - timestamps
- Availability
  - doctorId: ObjectId (ref Doctor, unique)
  - weeklySchedule: [ { weekday, startTime, endTime, duration, mode, isActive } ]
  - offDays: [String]
  - blockedDates: [ { date, reason } ]
  - timestamps
- DoctorPatientReport
  - doctorId: String
  - patientId: String
  - reportUrl: String
  - timestamps
- Prescription
  - doctorId: String
  - patientId: String
  - appointmentId: String
  - medicines: [ { name, dose, frequency, duration, notes } ]
  - issuedAt: Date
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| GET | /api/doctors | No | List doctors |
| POST | /api/doctors | No | Create doctor |
| GET | /api/doctors/:id | No | Get doctor |
| PATCH | /api/doctors/:id/profile | JWT (DOCTOR) | Update doctor profile |
| POST | /api/doctors/:id/profile/photo | JWT (DOCTOR) | Upload profile photo |
| POST | /api/doctors/:id/qualifications/upload | JWT (DOCTOR) | Upload qualification document |
| PATCH | /api/doctors/:id/availability | JWT (DOCTOR) | Update availability rules |
| GET | /api/doctors/:id/patient-reports/:patientId | JWT (DOCTOR) | Get patient reports |
| GET | /api/availability/:doctorId | JWT | Get availability |
| PUT | /api/availability/:doctorId | JWT | Update weekly availability |
| GET | /api/availability/:doctorId/is-available | JWT | Check date availability |
| GET | /api/availability/:doctorId/blocked-dates | JWT | List blocked dates |
| POST | /api/availability/:doctorId/blocked-dates | JWT | Add blocked date |
| DELETE | /api/availability/:doctorId/blocked-dates/:dateString | JWT | Remove blocked date |
| PATCH | /api/appointments/:id/respond | JWT (DOCTOR) | Respond to appointment |
| GET | /api/appointments/:id/telemedicine | JWT (DOCTOR) | Get telemedicine session info |
| POST | /api/prescriptions | JWT (DOCTOR) | Issue prescription |
| GET | /api/prescriptions | JWT (PATIENT) | List prescriptions for current patient |
| GET | /api/prescriptions/patient/:patientId | Internal | List prescriptions for patient |
| GET | /internal/doctors | Internal | List doctors |
| GET | /internal/doctors/:id | Internal | Get doctor |

### Inter-service calls
- Appointment service: respond and telemedicine session lookup.
- Patient service: internal patient profile for report access.

---

## notification-service
### Purpose
Consumes RabbitMQ notification events and delivers them via email, SMS (Notify.lk), or WhatsApp (Twilio). Stores delivery logs in MongoDB.

### Packages
Dependencies:
- amqplib@^1.0.3
- dotenv@^17.4.2
- express@^5.2.1
- mongoose@^9.4.1
- nodemailer@^8.0.5
- twilio@^5.13.1

Dev dependencies:
- nodemon@^3.1.14

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
SERVICE_NAME
MONGODB_URI
JWT_ACCESS_SECRET
INTERNAL_SERVICE_SECRET
RABBITMQ_URL
RABBITMQ_EXCHANGE
RABBITMQ_QUEUE
RABBITMQ_BINDING_KEY
RABBITMQ_RETRY_MS
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
EMAIL_FROM
NOTIFY_LK_API_URL
NOTIFY_LK_USER_ID
NOTIFY_LK_API_KEY
NOTIFY_LK_SENDER_ID
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_SMS_FROM
TWILIO_WHATSAPP_FROM
```

### MongoDB schemas
- NotificationLog
  - event: String
  - routingKey: String
  - recipientId: String
  - channels: [ { channel, status, error } ]
  - payload: Mixed
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |

### Events
- Consumes: bound to exchange smart_health.events with binding key notification.#
- Handles notification events:
  - notification.user.registered
  - notification.doctor.approved
  - notification.doctor.rejected
  - notification.account.suspended
  - notification.account.reactivated
  - notification.appointment.booked
  - notification.appointment.confirmed
  - notification.appointment.cancelled
  - notification.payment.success
  - notification.prescription.issued

---

## appointment-service
### Purpose
Appointment lifecycle, slot holds, waitlist promotions, feedback, emergency alerts, and notification preferences. Integrates with doctor, patient, telemedicine, and room services.

### Packages
Dependencies:
- amqplib@^1.0.3
- axios@^1.15.0
- bullmq@^5.58.0
- cors@^2.8.6
- date-fns@^4.1.0
- date-fns-tz@^3.2.0
- dotenv@^17.4.1
- express@^5.2.1
- express-validator@^7.3.2
- googleapis@^156.0.0
- helmet@^8.1.0
- ioredis@^5.8.1
- jsonwebtoken@^9.0.3
- mongoose@^9.4.1
- morgan@^1.10.1
- swagger-ui-express@^5.0.1
- twilio@^5.10.6
- uuid@^11.1.0
- winston@^3.18.3
- yamljs@^0.3.0

Dev dependencies:
- jest@^30.2.0
- mongodb-memory-server@^10.2.3
- nodemon@^3.1.14
- supertest@^7.1.4

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
MONGODB_URI
JWT_ACCESS_SECRET
JWT_ACCESS_EXPIRES
INTERNAL_SERVICE_SECRET
AUTH_SERVICE_URL
PATIENT_SERVICE_URL
DOCTOR_SERVICE_URL
TELEMEDICINE_SERVICE_URL
PAYMENT_SERVICE_URL
ROOM_SERVICE_URL
NOTIFICATION_SERVICE_URL
RABBITMQ_URL
RABBITMQ_EXCHANGE
REDIS_URL
SLOT_HOLD_TTL_MINUTES
MAX_ACTIVE_HOLDS_PER_PATIENT
CANCELLATION_CUTOFF_HOURS
REMINDER_24H_ENABLED
REMINDER_1H_ENABLED
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_CALENDAR_ID
GOOGLE_REFRESH_TOKEN
GOOGLE_ENCRYPTION_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
TWILIO_SMS_FROM
SWAGGER_SERVER_URL
```

### MongoDB schemas
- Appointment
  - doctorId: String
  - patientId: String
  - hospitalId: String
  - appointmentDate: String
  - startTime: Date
  - endTime: Date
  - mode: String (enum: IN_PERSON, TELEMEDICINE)
  - status: String (enum: HOLD, BOOKED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED)
  - reason: String
  - telemedicine: { meetingLink, provider, calendarEventId }
  - inPerson: { roomId, roomName, floor }
  - statusTimestamps: { holdAt, bookedAt, confirmedAt, completedAt, cancelledAt, noShowAt, rescheduledAt }
  - cancellation: { cancelledBy, cancelledByRole, reason, policyOverride }
  - metadata: Mixed
  - timestamps
- AvailabilityRule
  - doctorId: String
  - hospitalId: String
  - weekday: Number
  - startHour: Number
  - endHour: Number
  - slotDurationMinutes: Number
  - bufferMinutes: Number
  - mode: String (enum: IN_PERSON, TELEMEDICINE)
  - timezone: String
  - active: Boolean
  - timestamps
- SlotHold
  - doctorId: String
  - patientId: String
  - startTime: Date
  - endTime: Date
  - status: String (enum: ACTIVE, RELEASED, CONVERTED, EXPIRED)
  - expiresAt: Date
  - releasedAt: Date
  - releaseReason: String
  - timestamps
- Attendance
  - appointmentId: ObjectId (ref Appointment)
  - patientConfirmedAt: Date
  - doctorConfirmedAt: Date
  - patientConfirmedBy: String
  - doctorConfirmedBy: String
  - status: String (enum: PENDING, PARTIAL, CONFIRMED)
  - timestamps
- TimeOff
  - doctorId: String
  - startTime: Date
  - endTime: Date
  - reason: String
  - approvedBy: String
  - active: Boolean
  - timestamps
- Waitlist
  - doctorId: String
  - patientId: String
  - mode: String (enum: IN_PERSON, TELEMEDICINE)
  - preferredFrom: Date
  - preferredTo: Date
  - status: String (enum: ACTIVE, PROMOTED, EXPIRED, CANCELLED)
  - promotedAppointmentId: ObjectId (ref Appointment)
  - priority: Number
  - timestamps
- EmergencyAlert
  - appointmentId: ObjectId (ref Appointment)
  - raisedBy: String
  - raisedByRole: String
  - severity: String (enum: LOW, MEDIUM, HIGH, CRITICAL)
  - note: String
  - status: String (enum: OPEN, ACKNOWLEDGED, RESOLVED)
  - timestamps
- EmergencyResource
  - category: String (enum: HOSPITAL, AMBULANCE, HELPLINE, POLICE, FIRE)
  - name: String
  - phone: String
  - address: String
  - city: String
  - country: String
  - active: Boolean
  - timestamps
- Feedback
  - appointmentId: ObjectId (ref Appointment)
  - doctorId: String
  - patientId: String
  - rating: Number
  - review: String
  - isAnonymous: Boolean
  - moderationStatus: String (enum: VISIBLE, HIDDEN, FLAGGED, DELETED)
  - moderatedBy: String
  - moderatedAt: Date
  - timestamps
- NotificationLog
  - notificationId: String
  - appointmentId: ObjectId (ref Appointment)
  - userId: String
  - channel: String (enum: SMS, WHATSAPP, EMAIL)
  - eventType: String
  - deliveryStatus: String (enum: SENT, DELIVERED, FAILED)
  - providerMessageId: String
  - errorMessage: String
  - metadata: Mixed
  - timestamps
- NotificationPreference
  - userId: String
  - smsEnabled: Boolean
  - whatsappEnabled: Boolean
  - emailEnabled: Boolean
  - timezone: String
  - locale: String
  - timestamps
- AuditLog
  - appointmentId: ObjectId (ref Appointment)
  - entityType: String
  - entityId: String
  - action: String
  - actorId: String
  - actorRole: String
  - oldValue: Mixed
  - newValue: Mixed
  - metadata: Mixed
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| GET | /api/docs | No | Swagger UI |
| GET | /api/doctors | No | Search doctors |
| GET | /api/doctors/:id/availability | No | Doctor availability |
| GET | /api/appointments | JWT (PATIENT, DOCTOR, ADMIN, SUPER_ADMIN, STAFF) | List appointments |
| GET | /api/appointments/:id | JWT (PATIENT, DOCTOR, ADMIN, SUPER_ADMIN, STAFF) | Get appointment |
| POST | /api/appointments/hold | JWT (PATIENT) | Create slot hold |
| POST | /api/appointments | JWT (PATIENT) | Book appointment |
| PATCH | /api/appointments/:id/cancel | JWT (PATIENT, DOCTOR, ADMIN, SUPER_ADMIN, STAFF) | Cancel appointment |
| PATCH | /api/appointments/:id/reschedule | JWT (PATIENT, ADMIN, SUPER_ADMIN, STAFF) | Reschedule appointment |
| PATCH | /api/appointments/:id/confirm-attendance | JWT (PATIENT, DOCTOR) | Confirm attendance |
| PATCH | /api/appointments/:id/no-show | JWT (DOCTOR, ADMIN, SUPER_ADMIN, STAFF) | Mark no show |
| PATCH | /api/appointments/:id/respond | JWT (DOCTOR) | Respond to appointment |
| GET | /api/appointments/:id/telemedicine | JWT (DOCTOR, PATIENT) | Telemedicine session info |
| POST | /api/feedback | JWT (PATIENT) | Submit feedback |
| GET | /api/feedback/doctors/:id/reviews | No | Public doctor reviews |
| PATCH | /api/feedback/:id/moderate | JWT (ADMIN, SUPER_ADMIN, STAFF) | Moderate feedback |
| POST | /api/waitlist | JWT (PATIENT) | Join waitlist |
| POST | /api/emergency-alerts | JWT (DOCTOR, STAFF, ADMIN, SUPER_ADMIN) | Create emergency alert |
| GET | /api/emergency-resources | No | List emergency resources |
| GET | /api/notifications/preferences | JWT | Get notification preferences |
| PATCH | /api/notifications/preferences | JWT | Update notification preferences |
| GET | /api/admin/analytics | JWT (ADMIN, SUPER_ADMIN, STAFF) | Admin analytics |

### Events
- Publishes (RabbitMQ):
  - appointment.hold.created
  - telemedicine.appointment.scheduled
  - appointment.booked
  - notification.appointment.created
  - payment.appointment.booking_created
  - appointment.cancelled
  - notification.appointment.cancelled
  - appointment.rescheduled
  - appointment.confirmed
  - appointment.no_show
  - waitlist.promoted
  - notification.waitlist.promoted
  - feedback.submitted
  - emergency.alert.created
  - slot.released
  - notification.appointment.reminder
- Consumes:
  - consumer file exists for notification delivery updates (not wired in runtime)

### Inter-service calls
- doctor-service internal APIs for doctor profiles
- patient-service internal APIs for patient profiles
- telemedicine-service internal sessions
- room-service internal room assignment
- Google Calendar for telemedicine meetings

---

## payment-service
### Purpose
Stores appointment payment records and publishes payment events.

### Packages
Dependencies:
- amqplib@^0.10.9
- cors@^2.8.5
- dotenv@^17.2.3
- express@^5.1.0
- helmet@^8.1.0
- jsonwebtoken@^9.0.2
- mongoose@^8.19.1
- morgan@^1.10.0
- uuid@^13.0.0

Dev dependencies:
- nodemon@^3.1.10

### Environment variables (names only)
```
PORT
NODE_ENV
CLIENT_URL
MONGODB_URI
JWT_ACCESS_SECRET
RABBITMQ_URL
RABBITMQ_EXCHANGE
INTERNAL_SERVICE_SECRET
```

### MongoDB schemas
- Payment
  - appointmentId: String
  - patientId: String
  - doctorId: String
  - amount: Number
  - currency: String
  - status: String (enum: PENDING, AUTHORIZED, CAPTURED, FAILED, REFUNDED)
  - provider: String
  - providerPaymentId: String
  - metadata: Mixed
  - timestamps

### Routes
| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | /health | No | Health check |
| POST | /api/payments/checkout | JWT | Create checkout session |
| PATCH | /api/payments/:id/capture | JWT | Capture payment |
| PATCH | /api/payments/:id/fail | JWT | Mark payment failed |
| GET | /api/payments/appointment/:appointmentId | JWT | Get payment by appointment |

### Events
- Publishes (RabbitMQ):
  - payment.checkout.created
  - payment.captured
  - notification.payment.captured
  - payment.failed

---

## telemedicine-service
### Purpose
Directory exists but is empty. No source code to document.

---

## Inter-service communication summary
- api-gateway proxies external traffic to auth-service, admin-service, patient-service, ai-chatbot-service, doctor-service, appointment-service, and payment-service.
- admin-service uses auth-service internal endpoints with x-internal-service-secret.
- auth-service publishes notification.* events to RabbitMQ.
- patient-service calls appointment-service for history and doctor-service for prescriptions (falls back to appointment metadata).
- doctor-service calls appointment-service for appointment responses and telemedicine lookups, and patient-service internal profile for reports.
- appointment-service calls doctor-service and patient-service internal endpoints, telemedicine-service internal sessions, and room-service internal room assignment.
- notification-service consumes notification.* routing keys and delivers messages to email/SMS/WhatsApp.

## Authentication and security
- JWT access tokens validated in admin-service, api-gateway, ai-chatbot-service, patient-service, doctor-service, appointment-service, and payment-service.
- Role based access enforced where applicable (ADMIN, SUPER_ADMIN, STAFF, DOCTOR, PATIENT).
- Internal endpoints require x-internal-service-secret.

---

## Dockerfiles
### backend/admin-service/Dockerfile
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5025

CMD ["npm", "start"]
```

### backend/ai-chatbot-service/Dockerfile
```Dockerfile
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5031

CMD ["npm", "start"]
```

### backend/api-gateway/Dockerfile
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5026

CMD ["npm", "start"]
```

### backend/auth-service/Dockerfile
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5024

CMD ["npm", "start"]
```

### backend/patient-service/Dockerfile
```Dockerfile
FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5028

CMD ["npm", "start"]
```

### backend/doctor-service/Dockerfile
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5029

CMD ["npm", "start"]
```

### backend/notification-service/Dockerfile
```Dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5032
CMD ["node", "src/server.js"]
```

### backend/services/appointment-service/Dockerfile
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5027

CMD ["npm", "start"]
```

### backend/services/payment-service/Dockerfile
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5034

CMD ["npm", "start"]
```

---

## Kubernetes manifests (k8s/)
### admin-mongo.yaml
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: admin-mongo-pvc
  namespace: smart-health
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-mongo
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: admin-mongo
  template:
    metadata:
      labels:
        app: admin-mongo
    spec:
      containers:
        - name: mongo
          image: mongo:7
          ports:
            - containerPort: 27017
          volumeMounts:
            - name: admin-mongo-storage
              mountPath: /data/db
          readinessProbe:
            tcpSocket:
              port: 27017
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 27017
            initialDelaySeconds: 15
            periodSeconds: 20
      volumes:
        - name: admin-mongo-storage
          persistentVolumeClaim:
            claimName: admin-mongo-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: admin-mongo
  namespace: smart-health
spec:
  selector:
    app: admin-mongo
  ports:
    - port: 27017
      targetPort: 27017
```

### admin-service.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: admin-service
  template:
    metadata:
      labels:
        app: admin-service
    spec:
      containers:
        - name: admin-service
          image: smart-health-care-admin-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5025
          env:
            - name: PORT
              value: "5025"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: MONGODB_URI
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: ADMIN_MONGODB_URI
            - name: AUTH_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: AUTH_SERVICE_URL
            - name: RABBITMQ_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: RABBITMQ_URL
            - name: RABBITMQ_EXCHANGE
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: RABBITMQ_EXCHANGE
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
            - name: INTERNAL_SERVICE_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: INTERNAL_SERVICE_SECRET
          readinessProbe:
            httpGet:
              path: /health
              port: 5025
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5025
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: admin-service
  namespace: smart-health
spec:
  selector:
    app: admin-service
  ports:
    - port: 5025
      targetPort: 5025
```

### ai-chatbot-service-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-chatbot-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-chatbot-service
  template:
    metadata:
      labels:
        app: ai-chatbot-service
    spec:
      containers:
        - name: ai-chatbot-service
          image: smart-health-care-ai-chatbot-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5031
          env:
            - name: PORT
              value: "5031"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: GEMINI_MODEL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: GEMINI_MODEL
            - name: GEMINI_FALLBACK_MODELS
              value: gemini-1.5-flash
            - name: GEMINI_MAX_RETRIES
              value: "2"
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
            - name: GEMINI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: GEMINI_API_KEY
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 300m
              memory: 256Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 5031
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5031
            initialDelaySeconds: 20
            periodSeconds: 20
```

### ai-chatbot-service-service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-chatbot-service
  namespace: smart-health
spec:
  selector:
    app: ai-chatbot-service
  ports:
    - port: 5031
      targetPort: 5031
```

### api-gateway.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: smart-health-care-api-gateway:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5026
          env:
            - name: PORT
              value: "5026"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: AUTH_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: AUTH_SERVICE_URL
            - name: ADMIN_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: ADMIN_SERVICE_URL
            - name: PATIENT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: PATIENT_SERVICE_URL
            - name: AI_CHATBOT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: AI_CHATBOT_SERVICE_URL
            - name: APPOINTMENT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: APPOINTMENT_SERVICE_URL
            - name: PAYMENT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: PAYMENT_SERVICE_URL
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
          readinessProbe:
            httpGet:
              path: /health
              port: 5026
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5026
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: smart-health
spec:
  selector:
    app: api-gateway
  ports:
    - port: 5026
      targetPort: 5026
```

### appointment-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: appointment-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: appointment-service
  template:
    metadata:
      labels:
        app: appointment-service
    spec:
      containers:
        - name: appointment-service
          image: smart-health-care-appointment-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5027
          env:
            - name: PORT
              value: "5027"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: MONGODB_URI
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: APPOINTMENT_MONGODB_URI
            - name: AUTH_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: AUTH_SERVICE_URL
            - name: PATIENT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: PATIENT_SERVICE_URL
            - name: DOCTOR_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: DOCTOR_SERVICE_URL
            - name: TELEMEDICINE_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: TELEMEDICINE_SERVICE_URL
            - name: NOTIFICATION_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NOTIFICATION_SERVICE_URL
            - name: PAYMENT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: PAYMENT_SERVICE_URL
            - name: RABBITMQ_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: RABBITMQ_URL
            - name: REDIS_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: REDIS_URL
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
            - name: INTERNAL_SERVICE_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: INTERNAL_SERVICE_SECRET
          readinessProbe:
            httpGet:
              path: /health
              port: 5027
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5027
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: appointment-service
  namespace: smart-health
spec:
  selector:
    app: appointment-service
  ports:
    - port: 5027
      targetPort: 5027
```

### auth-mongo.yaml
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: auth-mongo-pvc
  namespace: smart-health
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-mongo
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-mongo
  template:
    metadata:
      labels:
        app: auth-mongo
    spec:
      containers:
        - name: mongo
          image: mongo:7
          ports:
            - containerPort: 27017
          volumeMounts:
            - name: auth-mongo-storage
              mountPath: /data/db
          readinessProbe:
            tcpSocket:
              port: 27017
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: 27017
            initialDelaySeconds: 15
            periodSeconds: 20
      volumes:
        - name: auth-mongo-storage
          persistentVolumeClaim:
            claimName: auth-mongo-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: auth-mongo
  namespace: smart-health
spec:
  selector:
    app: auth-mongo
  ports:
    - port: 27017
      targetPort: 27017
```

### auth-service.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: smart-health-care-auth-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5024
          env:
            - name: PORT
              value: "5024"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: COOKIE_SECURE
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: COOKIE_SECURE
            - name: MONGODB_URI
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: AUTH_MONGODB_URI
            - name: JWT_ACCESS_EXPIRES
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: JWT_ACCESS_EXPIRES
            - name: JWT_REFRESH_EXPIRES
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: JWT_REFRESH_EXPIRES
            - name: OTP_RESEND_COOLDOWN_SECONDS
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: OTP_RESEND_COOLDOWN_SECONDS
            - name: OTP_RATE_LIMIT_WINDOW_MINUTES
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: OTP_RATE_LIMIT_WINDOW_MINUTES
            - name: OTP_RATE_LIMIT_MAX
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: OTP_RATE_LIMIT_MAX
            - name: OTP_MAX_VERIFY_ATTEMPTS
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: OTP_MAX_VERIFY_ATTEMPTS
            - name: OTP_ATTEMPT_BLOCK_MINUTES
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: OTP_ATTEMPT_BLOCK_MINUTES
            - name: EMAIL_HOST
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: EMAIL_HOST
            - name: EMAIL_PORT
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: EMAIL_PORT
            - name: RABBITMQ_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: RABBITMQ_URL
            - name: RABBITMQ_EXCHANGE
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: RABBITMQ_EXCHANGE
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
            - name: JWT_REFRESH_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_REFRESH_SECRET
            - name: INTERNAL_SERVICE_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: INTERNAL_SERVICE_SECRET
            - name: EMAIL_USER
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: EMAIL_USER
            - name: EMAIL_PASS
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: EMAIL_PASS
            - name: EMAIL_FROM
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: EMAIL_FROM
          readinessProbe:
            httpGet:
              path: /health
              port: 5024
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5024
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: smart-health
spec:
  selector:
    app: auth-service
  ports:
    - port: 5024
      targetPort: 5024
```

### configmap.yaml
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: smart-health-config
  namespace: smart-health
data:
  AUTH_MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/auth_db?retryWrites=true&w=majority
  ADMIN_MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/admin_db?retryWrites=true&w=majority
  APPOINTMENT_MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/appointment_db?retryWrites=true&w=majority
  PAYMENT_MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/payment_db?retryWrites=true&w=majority
  PATIENT_MONGODB_URI: mongodb+srv://username:password@cluster.mongodb.net/patient_db?retryWrites=true&w=majority
  AUTH_SERVICE_URL: http://auth-service:5024
  ADMIN_SERVICE_URL: http://admin-service:5025
  PATIENT_SERVICE_URL: http://patient-service:5028
  AI_CHATBOT_SERVICE_URL: http://ai-chatbot-service:5031
  APPOINTMENT_SERVICE_URL: http://appointment-service:5027
  DOCTOR_SERVICE_URL: http://doctor-service:5029
  PAYMENT_SERVICE_URL: http://payment-service:5034
  TELEMEDICINE_SERVICE_URL: http://telemedicine-service:5033
  NOTIFICATION_SERVICE_URL: http://notification-service:5032
  RABBITMQ_URL: amqp://rabbitmq:5672
  RABBITMQ_EXCHANGE: smart_health.events
  REDIS_URL: redis://redis:6379
  CLIENT_URL: http://smart-health.local
  NODE_ENV: production
  COOKIE_SECURE: "false"
  REPORT_MAX_FILE_SIZE_MB: "10"
  CLOUDINARY_REPORTS_FOLDER: smart-health/patient-reports
  GEMINI_MODEL: gemini-1.5-flash
  JWT_ACCESS_EXPIRES: 15m
  JWT_REFRESH_EXPIRES: 7d
  OTP_RESEND_COOLDOWN_SECONDS: "60"
  OTP_RATE_LIMIT_WINDOW_MINUTES: "15"
  OTP_RATE_LIMIT_MAX: "5"
  OTP_MAX_VERIFY_ATTEMPTS: "5"
  OTP_ATTEMPT_BLOCK_MINUTES: "15"
  EMAIL_HOST: smtp.gmail.com
  EMAIL_PORT: "587"
```

### frontend.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: smart-health-care-frontend:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: smart-health
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
```

### ingress.yaml
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smart-health-ingress
  namespace: smart-health
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  rules:
    - host: smart-health.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### kustomization.yaml
```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - configmap.yaml
  - secret.yaml
  - auth-service.yaml
  - admin-service.yaml
  - patient-service-deployment.yaml
  - patient-service-service.yaml
  - ai-chatbot-service-deployment.yaml
  - ai-chatbot-service-service.yaml
  - api-gateway.yaml
  - appointment-deployment.yaml
  - payment-deployment.yaml
  - frontend.yaml
  - ingress.yaml
```

### namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smart-health
```

### patient-service-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patient-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: patient-service
  template:
    metadata:
      labels:
        app: patient-service
    spec:
      containers:
        - name: patient-service
          image: smart-health-care-patient-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5028
          env:
            - name: PORT
              value: "5028"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: MONGODB_URI
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: PATIENT_MONGODB_URI
            - name: APPOINTMENT_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: APPOINTMENT_SERVICE_URL
            - name: DOCTOR_SERVICE_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: DOCTOR_SERVICE_URL
            - name: REPORT_MAX_FILE_SIZE_MB
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: REPORT_MAX_FILE_SIZE_MB
            - name: CLOUDINARY_REPORTS_FOLDER
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLOUDINARY_REPORTS_FOLDER
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
            - name: INTERNAL_SERVICE_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: INTERNAL_SERVICE_SECRET
            - name: CLOUDINARY_CLOUD_NAME
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: CLOUDINARY_CLOUD_NAME
            - name: CLOUDINARY_API_KEY
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: CLOUDINARY_API_KEY
            - name: CLOUDINARY_API_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: CLOUDINARY_API_SECRET
          resources:
            requests:
              cpu: 100m
              memory: 192Mi
            limits:
              cpu: 400m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 5028
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5028
            initialDelaySeconds: 20
            periodSeconds: 20
```

### patient-service-service.yaml
```yaml
apiVersion: v1
kind: Service
metadata:
  name: patient-service
  namespace: smart-health
spec:
  selector:
    app: patient-service
  ports:
    - port: 5028
      targetPort: 5028
```

### payment-deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: payment-service
  template:
    metadata:
      labels:
        app: payment-service
    spec:
      containers:
        - name: payment-service
          image: smart-health-care-payment-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5034
          env:
            - name: PORT
              value: "5034"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: CLIENT_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: CLIENT_URL
            - name: MONGODB_URI
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: PAYMENT_MONGODB_URI
            - name: RABBITMQ_URL
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: RABBITMQ_URL
            - name: JWT_ACCESS_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: JWT_ACCESS_SECRET
            - name: INTERNAL_SERVICE_SECRET
              valueFrom:
                secretKeyRef:
                  name: smart-health-secrets
                  key: INTERNAL_SERVICE_SECRET
          readinessProbe:
            httpGet:
              path: /health
              port: 5034
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5034
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: payment-service
  namespace: smart-health
spec:
  selector:
    app: payment-service
  ports:
    - port: 5034
      targetPort: 5034
```

---

## Notable inconsistencies and gaps
- doctor-service server.js expects MONGO_URI but .env defines MONGODB_URI.
- notification-service listens for notification.payment.success and notification.appointment.booked/confirmed, while payment-service and appointment-service publish notification.payment.captured and notification.appointment.created.
- kustomization.yaml references secret.yaml, but that file is not present in k8s/.
- payment-service .env appears to contain patient-service variables (paths and values do not match payment-service).
