# Smart Healthcare Platform - Backend Microservices Documentation

## Project Overview
- Project name: Smart Healthcare Platform
- Tech stack: Node.js, Express, MongoDB (Mongoose), JWT, RabbitMQ (amqplib), Redis (BullMQ/ioredis), Cloudinary, Nodemailer, Google APIs, Twilio, Swagger/OpenAPI, Docker, Kubernetes
- Architecture type: Microservices (REST + event-driven, background jobs via Redis/BullMQ)
- Services and ports:
  - api-gateway: 5026
  - auth-service: 5024
  - admin-service: 5025
  - ai-chatbot-service: 5031
  - patient-service: 5028
  - appointment-service: 5027
  - payment-service: 5034
  - doctor-service: 5003
  - notification-service: 5032 (referenced in appointment-service .env.example/configmap; no source files under backend/notification-service)
  - telemedicine-service: 5033 (referenced in appointment-service .env.example/configmap; no source files under backend/telemedicine-service)
  - room-service: 5030 (referenced in appointment-service .env.example)
- Communication: API Gateway proxies REST calls; internal REST calls use x-internal-service-secret; RabbitMQ events published by appointment-service and payment-service.
- Scope note: node_modules, coverage, dist, and package-lock.json files excluded as generated/dependencies per request.

---

## Service 1: admin-service
### Purpose
Handles admin-facing operations such as managing admin profiles, approving/rejecting doctors, updating user status, and serving dashboard/security analytics. It stores admin actions locally and delegates user/admin data operations to auth-service.

### Tech Stack
Dependencies:
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

### Database
- Database name: admin_db
- Models:
  - AdminAction
    - adminUserId: String (required)
    - targetUserId: String (required)
    - action: String (enum: DOCTOR_APPROVED, DOCTOR_REJECTED, DOCTOR_CHANGES_REQUESTED, ADMIN_CREATED, ADMIN_DELETED, USER_SUSPENDED, USER_ACTIVATED)
    - reason: String (default null)
    - timestamps: createdAt, updatedAt

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| GET | /api/admin/profile | Get current admin profile | Yes (ADMIN/SUPER_ADMIN) |
| PATCH | /api/admin/profile | Update current admin profile | Yes (ADMIN/SUPER_ADMIN) |
| POST | /api/admin/profile/photo | Upload admin profile photo | Yes (ADMIN/SUPER_ADMIN) |
| DELETE | /api/admin/profile/photo | Remove admin profile photo | Yes (ADMIN/SUPER_ADMIN) |
| PATCH | /api/admin/profile/password | Change admin password | Yes (ADMIN/SUPER_ADMIN) |
| GET | /api/admin/admins | List admins | Yes (SUPER_ADMIN) |
| POST | /api/admin/admins | Create admin | Yes (SUPER_ADMIN) |
| DELETE | /api/admin/admins/:id | Delete admin | Yes (SUPER_ADMIN) |
| GET | /api/admin/users | List users | Yes (ADMIN/SUPER_ADMIN) |
| GET | /api/admin/doctors/pending | List pending doctors | Yes (ADMIN/SUPER_ADMIN) |
| PATCH | /api/admin/doctors/:id/approve | Approve doctor | Yes (ADMIN/SUPER_ADMIN) |
| PATCH | /api/admin/doctors/:id/reject | Reject doctor | Yes (ADMIN/SUPER_ADMIN) |
| PATCH | /api/admin/users/:id/status | Update user status | Yes (ADMIN/SUPER_ADMIN) |
| GET | /api/admin/security/activity | Security activity feed | Yes (ADMIN/SUPER_ADMIN) |
| GET | /api/admin/actions | Admin actions list | Yes (ADMIN/SUPER_ADMIN) |
| GET | /api/admin/dashboard/stats | Dashboard stats | Yes (ADMIN/SUPER_ADMIN) |

### Environment Variables
```env
PORT=5025
NODE_ENV=development
CLIENT_URL=http://localhost:8080

MONGODB_URI=mongodb+srv://admin:123@cluster0.9pl6rst.mongodb.net/admin_db?retryWrites=true&w=majority&appName=Cluster0

JWT_ACCESS_SECRET=sasuke
AUTH_SERVICE_URL=http://localhost:5024
INTERNAL_SERVICE_SECRET=super_internal_secret
```

### Folder Structure
```text
admin-service/
  .dockerignore
  .env
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      env.js
    controllers/
      admin.controller.js
      dashboard.controller.js
    middlewares/
      auth.middleware.js
      error.middleware.js
      role.middleware.js
      validate.middleware.js
    models/
      AdminAction.js
    routes/
      admin.routes.js
      dashboard.routes.js
    services/
      admin.service.js
      authClient.service.js
      dashboard.service.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
      dashboardAnalytics.js
      dashboardAnalytics.test.js
      securityActivity.js
      securityActivity.test.js
    validations/
      admin.validation.js
```

---

## Service 2: ai-chatbot-service
### Purpose
Provides AI chat responses for patients using the Gemini API. Conversations are stored in memory for short context windows.

### Tech Stack
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

### Database
- Database name: None
- Models: None (conversation context stored in memory)

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| POST | /api/ai/chat | Generate AI reply | Yes (PATIENT) |

### Environment Variables
```env
PORT=5031
NODE_ENV=development
CLIENT_URL=http://localhost:8080
JWT_ACCESS_SECRET=sasuke
GEMINI_API_KEY=replace-with-new-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_FALLBACK_MODELS=gemini-1.5-flash
GEMINI_MAX_RETRIES=2
```

### Folder Structure
```text
ai-chatbot-service/
  .env.example
  .gitignore
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      env.js
    constants/
      specialties.js
    controllers/
      chat.controller.js
    middlewares/
      auth.middleware.js
      error.middleware.js
      validate.middleware.js
    routes/
      chat.routes.js
    services/
      chat.service.js
      history.service.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
```

---

## Service 3: api-gateway
### Purpose
Routes external HTTP traffic to backend services, applies global rate limiting, and validates JWTs for protected upstreams.

### Tech Stack
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

### Database
- Database name: None
- Models: None

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| ALL | /api/auth/* | Proxy to auth-service | No |
| ALL | /api/admin/* | Proxy to admin-service | Yes (JWT) |
| ALL | /api/patients/* | Proxy to patient-service | Yes (JWT) |
| ALL | /api/ai/* | Proxy to ai-chatbot-service | Yes (JWT) |
| ALL | /api/doctors/* | Proxy to appointment-service | No |
| ALL | /api/feedback/doctors/* | Proxy to appointment-service | No |
| ALL | /api/emergency-resources/* | Proxy to appointment-service | No |
| ALL | /api/appointments/* | Proxy to appointment-service | Yes (JWT) |
| ALL | /api/feedback/* | Proxy to appointment-service | Yes (JWT) |
| ALL | /api/waitlist/* | Proxy to appointment-service | Yes (JWT) |
| ALL | /api/emergency-alerts/* | Proxy to appointment-service | Yes (JWT) |
| ALL | /api/notifications/* | Proxy to appointment-service | Yes (JWT) |
| ALL | /api/payments/* | Proxy to payment-service | Yes (JWT) |

### Environment Variables
```env
PORT=5026
NODE_ENV=development
CLIENT_URL=http://localhost:8080

JWT_ACCESS_SECRET=sasuke
AUTH_SERVICE_URL=http://localhost:5024
ADMIN_SERVICE_URL=http://localhost:5025
```
Note: app.js also references PATIENT_SERVICE_URL, AI_CHATBOT_SERVICE_URL, APPOINTMENT_SERVICE_URL, PAYMENT_SERVICE_URL.

### Folder Structure
```text
api-gateway/
  .dockerignore
  .env
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      env.js
    middlewares/
      auth.middleware.js
      error.middleware.js
      optionalAuth.middleware.js
      rateLimit.middleware.js
    routes/
      gateway.routes.js
    services/
      proxy.service.js
    utils/
      AppError.js
```

---

## Service 4: auth-service
### Purpose
Manages user registration, authentication, JWT issuance and rotation, OTP-based email verification and password resets, and internal admin operations for other services.

### Tech Stack
Dependencies:
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

### Database
- Database name: auth_db
- Models:
  - User
    - fullName: String (required)
    - email: String (required, unique)
    - phone: String (required)
    - jobTitle: String (default null)
    - profilePhoto: { url: String, publicId: String, uploadedAt: Date } or null
    - passwordHash: String (required)
    - role: String (enum: PATIENT, DOCTOR, ADMIN, SUPER_ADMIN)
    - isEmailVerified: Boolean (default false)
    - accountStatus: String (enum: PENDING, ACTIVE, SUSPENDED, LOCKED)
    - identityType: String (enum: NIC, PASSPORT, null)
    - nic: String (unique, sparse)
    - passportNumber: String (unique, sparse)
    - nationality: String
    - doctorVerificationStatus: String (enum: NOT_REQUIRED, PENDING, APPROVED, CHANGES_REQUESTED, REJECTED)
    - medicalLicenseNumber: String
    - specialization: String
    - yearsOfExperience: Number (default 0)
    - qualificationDocuments: [String]
    - verificationDocuments: [ { filename, url, publicId, mimeType, size, uploadedAt } ]
    - verificationLinks: [String]
    - doctorReviewedBy: ObjectId
    - doctorReviewedAt: Date
    - doctorRejectionReason: String
    - accountStatusChangedBy: ObjectId
    - accountStatusChangedAt: Date
    - accountStatusReason: String
    - failedLoginAttempts: Number (default 0)
    - lockUntil: Date
    - lastLoginAt: Date
    - timestamps: createdAt, updatedAt
  - Otp
    - email: String (required)
    - purpose: String (enum: EMAIL_VERIFY, PASSWORD_RESET)
    - otpCode: String (required)
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

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| POST | /api/auth/register/patient | Register patient | No |
| POST | /api/auth/register/doctor | Register doctor | No |
| POST | /api/auth/doctor/verification/resubmit | Resubmit doctor verification | Yes (DOCTOR) |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user | Yes (JWT) |
| POST | /api/auth/verify-email-otp | Verify email OTP | No |
| POST | /api/auth/resend-email-otp | Resend OTP | No |
| POST | /api/auth/forgot-password | Request password reset OTP | No |
| POST | /api/auth/reset-password | Reset password | No |
| POST | /api/auth/refresh-token | Rotate refresh token | No (refresh token cookie required) |
| POST | /api/auth/logout | Logout | No (refresh token cookie required) |
| GET | /internal/admin/admins/me | Get current admin profile (internal) | Internal (x-internal-service-secret) |
| PATCH | /internal/admin/admins/me | Update current admin profile (internal) | Internal (x-internal-service-secret) |
| POST | /internal/admin/admins/me/photo | Upload admin profile photo (internal) | Internal (x-internal-service-secret) |
| DELETE | /internal/admin/admins/me/photo | Remove admin profile photo (internal) | Internal (x-internal-service-secret) |
| PATCH | /internal/admin/admins/me/password | Change admin password (internal) | Internal (x-internal-service-secret) |
| GET | /internal/admin/admins | List admins (internal) | Internal (x-internal-service-secret) |
| POST | /internal/admin/admins | Create admin (internal) | Internal (x-internal-service-secret) |
| DELETE | /internal/admin/admins/:id | Delete admin (internal) | Internal (x-internal-service-secret) |
| GET | /internal/admin/users | List users (internal) | Internal (x-internal-service-secret) |
| GET | /internal/admin/auth-logs | List auth logs (internal) | Internal (x-internal-service-secret) |
| GET | /internal/admin/doctors/pending | List pending doctors (internal) | Internal (x-internal-service-secret) |
| PATCH | /internal/admin/doctors/:id/approve | Approve doctor (internal) | Internal (x-internal-service-secret) |
| PATCH | /internal/admin/doctors/:id/reject | Reject doctor (internal) | Internal (x-internal-service-secret) |
| PATCH | /internal/admin/users/:id/status | Update user status (internal) | Internal (x-internal-service-secret) |
| GET | /internal/admin/dashboard/counts | Dashboard counts (internal) | Internal (x-internal-service-secret) |

### Environment Variables
```env
PORT=5024
NODE_ENV=development
CLIENT_URL=http://localhost:8080
COOKIE_SECURE=false

MONGODB_URI=mongodb+srv://admin:123@cluster0.9pl6rst.mongodb.net/auth_db?retryWrites=true&w=majority&appName=Cluster0

JWT_ACCESS_SECRET=sasuke
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=supersecretrefreshkey
JWT_REFRESH_EXPIRES=7d

INTERNAL_SERVICE_SECRET=super_internal_secret

OTP_RESEND_COOLDOWN_SECONDS=60
OTP_RATE_LIMIT_WINDOW_MINUTES=15
OTP_RATE_LIMIT_MAX=5
OTP_MAX_VERIFY_ATTEMPTS=5
OTP_ATTEMPT_BLOCK_MINUTES=15

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=leonxx356@gmail.com
EMAIL_PASS=vcvg aypl mtys vfee
EMAIL_FROM=leonxx356@gmail.com
```

### Folder Structure
```text
auth-service/
  .dockerignore
  .env
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      db.js
      env.js
    controllers/
      auth.controller.js
      internalAdmin.controller.js
    middlewares/
      auth.middleware.js
      error.middleware.js
      internal.middleware.js
      role.middleware.js
      validate.middleware.js
    models/
      AuthLog.js
      Otp.js
      RefreshToken.js
      User.js
    routes/
      auth.routes.js
      internalAdmin.routes.js
    seeds/
      admin.seed.js
    services/
      audit.service.js
      auth.service.js
      email.service.js
      internalAdmin.service.js
      otp.service.js
      storage.service.js
      token.service.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
      cookies.js
      dashboardAnalytics.js
      dashboardAnalytics.test.js
      doctorVerification.js
      doctorVerification.test.js
      hash.js
      jwt.js
    validations/
      auth.validation.js
      internalAdmin.validation.js
```

---

## Service 5: patient-service
### Purpose
Manages patient profiles and reports, and fetches appointment history and prescription data from upstream services.

### Tech Stack
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

### Database
- Database name: value comes from MONGODB_URI (example shows mongodb+srv: without a database name)
- Models:
  - Patient
    - userId: String (required, unique)
    - email: String
    - fullName: String (default "Patient")
    - dateOfBirth: Date
    - bloodGroup: String (enum: A+, A-, B+, B-, AB+, AB-, O+, O-)
    - contactNumber: String
    - address: String
    - allergies: [String]
    - reports: [ { filename, url, publicId, resourceType, mimeType, size, uploadDate } ]
    - medicalNotes: String
    - timestamps

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| GET | /api/patients/profile | Get patient profile | Yes (PATIENT) |
| PUT | /api/patients/profile | Update patient profile | Yes (PATIENT) |
| POST | /api/patients/reports | Upload report | Yes (PATIENT) |
| GET | /api/patients/reports | List reports | Yes (PATIENT) |
| DELETE | /api/patients/reports | Delete report | Yes (PATIENT) |
| GET | /api/patients/history | Appointment history | Yes (PATIENT) |
| GET | /api/patients/prescriptions | Prescriptions | Yes (PATIENT) |
| GET | /internal/patients/:patientId | Internal patient profile | Internal (x-internal-service-secret) |

### Environment Variables
```env
PORT=5028
NODE_ENV=development
CLIENT_URL=http://localhost:8080
MONGODB_URI=mongodb+srv:
JWT_ACCESS_SECRET=sasuke
INTERNAL_SERVICE_SECRET=super_internal_secret
APPOINTMENT_SERVICE_URL=http://localhost:5027
DOCTOR_SERVICE_URL=http://localhost:5029
REPORT_MAX_FILE_SIZE_MB=10
CLOUDINARY_CLOUD_NAME=dbcuhn1bi
CLOUDINARY_API_KEY=353337125652862
CLOUDINARY_API_SECRET=r1vBj2s5-r0YPMsy1Bj5LtRUPgU
CLOUDINARY_REPORTS_FOLDER=smart-health/patient-reports
```

### Folder Structure
```text
patient-service/
  .env.example
  .gitignore
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      env.js
    controllers/
      patient.controller.js
    middlewares/
      auth.middleware.js
      error.middleware.js
      internal.middleware.js
      role.middleware.js
      validate.middleware.js
    models/
      Patient.js
    routes/
      internal.routes.js
      patient.routes.js
    services/
      patient.service.js
      storage.service.js
      upstream.service.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
    validations/
      patient.validation.js
```

---

## Service 6: appointment-service (services/appointment-service)
### Purpose
Manages appointment lifecycle, slot holds, waitlists, feedback, emergency alerts, notifications, and admin analytics. Integrates with doctor, patient, telemedicine, room, and notification systems and publishes events to RabbitMQ.

### Tech Stack
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

### Database
- Database name: appointment_db
- Models:
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

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| GET | /api/docs | Swagger UI | No |
| GET | /api/doctors | Search doctors | No |
| GET | /api/doctors/:id/availability | Doctor availability | No |
| GET | /api/appointments | List appointments | Yes (PATIENT/DOCTOR/ADMIN/SUPER_ADMIN/STAFF) |
| POST | /api/appointments/hold | Create slot hold | Yes (PATIENT) |
| POST | /api/appointments | Book appointment | Yes (PATIENT) |
| PATCH | /api/appointments/:id/cancel | Cancel appointment | Yes (PATIENT/DOCTOR/ADMIN/SUPER_ADMIN/STAFF) |
| PATCH | /api/appointments/:id/reschedule | Reschedule appointment | Yes (PATIENT/ADMIN/SUPER_ADMIN/STAFF) |
| PATCH | /api/appointments/:id/confirm-attendance | Confirm attendance | Yes (PATIENT/DOCTOR) |
| PATCH | /api/appointments/:id/no-show | Mark no-show | Yes (DOCTOR/ADMIN/SUPER_ADMIN/STAFF) |
| POST | /api/feedback | Submit feedback | Yes (PATIENT) |
| GET | /api/feedback/doctors/:id/reviews | Public doctor reviews | No |
| PATCH | /api/feedback/:id/moderate | Moderate feedback | Yes (ADMIN/SUPER_ADMIN/STAFF) |
| POST | /api/waitlist | Join waitlist | Yes (PATIENT) |
| POST | /api/emergency-alerts | Create emergency alert | Yes (DOCTOR/STAFF/ADMIN/SUPER_ADMIN) |
| GET | /api/emergency-resources | List emergency resources | No |
| GET | /api/notifications/preferences | Get notification preferences | Yes (JWT) |
| PATCH | /api/notifications/preferences | Update notification preferences | Yes (JWT) |
| GET | /api/admin/analytics | Admin analytics | Yes (ADMIN/SUPER_ADMIN/STAFF) |

### Environment Variables
```env
PORT=5027
NODE_ENV=development
CLIENT_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/appointment_db
JWT_ACCESS_SECRET=change_me
JWT_ACCESS_EXPIRES=15m
INTERNAL_SERVICE_SECRET=change_internal_secret
AUTH_SERVICE_URL=http://auth-service:5024
PATIENT_SERVICE_URL=http://patient-service:5028
DOCTOR_SERVICE_URL=http://doctor-service:5029
TELEMEDICINE_SERVICE_URL=http://telemedicine-service:5033
PAYMENT_SERVICE_URL=http://payment-service:5034
ROOM_SERVICE_URL=http://room-service:5030
NOTIFICATION_SERVICE_URL=http://notification-service:5032
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=smart_health.events
REDIS_URL=redis://localhost:6379
SLOT_HOLD_TTL_MINUTES=10
MAX_ACTIVE_HOLDS_PER_PATIENT=3
CANCELLATION_CUTOFF_HOURS=12
REMINDER_24H_ENABLED=true
REMINDER_1H_ENABLED=true
GOOGLE_CLIENT_ID=change_me
GOOGLE_CLIENT_SECRET=change_me
GOOGLE_REDIRECT_URI=http://localhost:5027/api/appointments/google/callback
GOOGLE_CALENDAR_ID=primary
GOOGLE_ENCRYPTION_KEY=change_32_chars_minimum_key
TWILIO_ACCOUNT_SID=change_me
TWILIO_AUTH_TOKEN=change_me
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SMS_FROM=+10000000000
SWAGGER_SERVER_URL=http://localhost:5027
```

### Folder Structure
```text
services/appointment-service/
  .dockerignore
  .env.example
  .gitignore
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      db.js
      env.js
      rabbitmq.js
      redis.js
      swagger.js
    controllers/
      admin.controller.js
      appointment.controller.js
      doctor.controller.js
      emergency.controller.js
      feedback.controller.js
      notification.controller.js
      waitlist.controller.js
    docs/
      openapi.yaml
    events/
      consumers/
        notificationStatus.consumer.js
      publishers/
        eventPublisher.js
    integrations/
      doctorService.client.js
      googleCalendar.client.js
      patientService.client.js
      roomService.client.js
      telemedicineService.client.js
      twilio.provider.js
    jobs/
      workers.js
    middlewares/
      auth.middleware.js
      error.middleware.js
      rateLimit.middleware.js
      requestId.middleware.js
      role.middleware.js
      validate.middleware.js
    models/
      Appointment.js
      Attendance.js
      AuditLog.js
      AvailabilityRule.js
      EmergencyAlert.js
      EmergencyResource.js
      Feedback.js
      NotificationLog.js
      NotificationPreference.js
      SlotHold.js
      TimeOff.js
      Waitlist.js
    repositories/
      appointment.repository.js
    routes/
      admin.routes.js
      appointment.routes.js
      docs.routes.js
      doctor.routes.js
      emergency.routes.js
      emergencyResource.routes.js
      feedback.routes.js
      notification.routes.js
      waitlist.routes.js
    services/
      admin.service.js
      appointment.service.js
      audit.service.js
      doctor.service.js
      emergency.service.js
      feedback.service.js
      notification.service.js
      waitlist.service.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
      constants.js
      dateTime.js
      logger.js
    validations/
      admin.validation.js
      appointment.validation.js
      doctor.validation.js
      emergency.validation.js
      feedback.validation.js
      notification.validation.js
      waitlist.validation.js
  tests/
    integration/
      health.test.js
    unit/
      dateTime.test.js
```

---

## Service 7: payment-service (services/payment-service)
### Purpose
Manages appointment payment records and publishes payment lifecycle events.

### Tech Stack
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

### Database
- Database name: payment_db
- Models:
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

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| POST | /api/payments/checkout | Create checkout session | Yes (JWT) |
| PATCH | /api/payments/:id/capture | Capture payment | Yes (JWT) |
| PATCH | /api/payments/:id/fail | Mark payment failed | Yes (JWT) |
| GET | /api/payments/appointment/:appointmentId | Get payment by appointment | Yes (JWT) |

### Environment Variables
```env
PORT=5034
NODE_ENV=development
CLIENT_URL=http://localhost:8080
MONGODB_URI=mongodb://localhost:27017/payment_db
JWT_ACCESS_SECRET=change_me
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=smart_health.events
INTERNAL_SERVICE_SECRET=change_me
```

### Folder Structure
```text
services/payment-service/
  .dockerignore
  .env.example
  .gitignore
  app.js
  Dockerfile
  package.json
  server.js
  src/
    config/
      db.js
      env.js
    controllers/
      payment.controller.js
    events/
      publishers/
        eventPublisher.js
    middlewares/
      auth.middleware.js
      error.middleware.js
    models/
      Payment.js
    routes/
      payment.routes.js
    services/
      payment.service.js
    utils/
      apiResponse.js
      AppError.js
      asyncHandler.js
```

---

## Service 8: doctor-service
### Purpose
Provides a minimal doctor directory with basic create and read endpoints.

### Tech Stack
Dependencies:
- cors@^2.8.6
- dotenv@^17.4.2
- express@^5.2.1
- express-validator@^7.3.2
- jsonwebtoken@^9.0.3
- mongoose@^9.4.1

Dev dependencies:
- nodemon@^3.1.14

### Database
- Database name: doctor-db
- Models:
  - Doctor
    - userId: ObjectId (ref User)
    - licenseNumber: String
    - specialties: [String]
    - bio: String
    - isVerified: Boolean
    - timestamps

### API Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| GET | /api/doctors | List doctors | No |
| GET | /api/doctors/:id | Get doctor by id | No |
| POST | /api/doctors | Create doctor | No |

### Environment Variables
```env
PORT=5003
MONGO_URI=mongodb://localhost:27017/doctor-db
JWT_SECRET=your_jwt_secret_here
```

### Folder Structure
```text
doctor-service/
  .env
  .gitignore
  package.json
  src/
    app.js
    server.js
    config/
      env.js
    controllers/
      doctor.controller.js
    middlewares/
      error.middleware.js
      validate.middleware.js
    models/
      doctor.model.js
    routes/
      doctor.routes.js
    services/
      doctor.service.js
    utils/
      apiResponse.js
      asyncHandler.js
    validations/
      doctor.validation.js
```

---

## Service 9: notification-service
### Purpose
No source files were found in backend/notification-service (node_modules excluded). This service cannot be documented further from the backend folder.

### Tech Stack
Not available in backend/notification-service.

### Database
Not available.

### API Endpoints
No routes found.

### Environment Variables
No .env or .env.example found in backend/notification-service.

### Folder Structure
```text
notification-service/
  (no source files; node_modules excluded)
```

---

## Service 10: telemedicine-service
### Purpose
No source files were found in backend/telemedicine-service. This service cannot be documented further from the backend folder.

### Tech Stack
Not available in backend/telemedicine-service.

### Database
Not available.

### API Endpoints
No routes found.

### Environment Variables
No .env or .env.example found in backend/telemedicine-service.

### Folder Structure
```text
telemedicine-service/
  (empty)
```

---

## Inter-Service Communication
- api-gateway proxies external REST calls to auth-service, admin-service, patient-service, ai-chatbot-service, appointment-service, and payment-service; it applies JWT validation for protected proxy routes.
- admin-service calls auth-service internal endpoints via AUTH_SERVICE_URL with x-internal-service-secret to manage admins, users, and doctor approvals.
- patient-service calls appointment-service /api/appointments for history, and doctor-service /api/prescriptions for prescriptions when DOCTOR_SERVICE_URL is configured; it falls back to appointment-service metadata if doctor-service is unavailable.
- appointment-service calls doctor-service internal endpoints (/internal/doctors and /internal/doctors/:id), patient-service internal endpoints (/internal/patients/:id), telemedicine-service internal sessions (/internal/sessions), and room-service internal room assignment (/internal/rooms/assign) using x-internal-service-secret.
- appointment-service integrates with Google Calendar (googleapis) for telemedicine meetings and can initialize Twilio for notifications.
- ai-chatbot-service calls the Gemini API via @google/generative-ai.
- auth-service integrates with Cloudinary for document/photo storage and SMTP via Nodemailer.

### RabbitMQ Events
Published:
- appointment-service
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
- payment-service
  - payment.checkout.created
  - payment.captured
  - notification.payment.captured
  - payment.failed

Consumed:
- appointment-service defines handleNotificationDeliveryUpdate (updates NotificationLog using notificationId, deliveryStatus, providerMessageId, errorMessage). Wiring to a queue/consumer is not shown in code.

## Authentication & Security
- auth-service issues JWT access tokens (userId, role, email, fullName, phone) and refresh tokens. Refresh tokens are hashed and stored in MongoDB, and set as httpOnly cookies; cookie security is controlled by COOKIE_SECURE or NODE_ENV.
- JWT access validation is enforced by protect middlewares in admin-service, api-gateway, ai-chatbot-service, patient-service, appointment-service, and payment-service.
- Role-based access control is implemented via allowRoles in admin-service, auth-service, patient-service, and appointment-service. Roles defined across services include PATIENT, DOCTOR, ADMIN, SUPER_ADMIN, and STAFF (appointment-service).
- Internal service communication is protected by x-internal-service-secret in auth-service and patient-service internal routes. Appointment-service uses this header when calling internal endpoints in other services.

## Docker & Kubernetes
### Dockerfiles
#### admin-service
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5025

CMD ["npm", "start"]
```

#### ai-chatbot-service
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

#### api-gateway
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5026

CMD ["npm", "start"]
```

#### auth-service
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5024

CMD ["npm", "start"]
```

#### patient-service
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

#### appointment-service
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5027

CMD ["npm", "start"]
```

#### payment-service
```Dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5034

CMD ["npm", "start"]
```

#### doctor-service
No Dockerfile found in backend/doctor-service.

### Kubernetes Manifests (k8s/)
#### admin-mongo.yaml
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

#### admin-service.yaml
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

#### ai-chatbot-service-deployment.yaml
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

#### ai-chatbot-service-service.yaml
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

#### api-gateway.yaml
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

#### appointment-deployment.yaml
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

#### auth-mongo.yaml
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

#### auth-service.yaml
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

#### patient-service-deployment.yaml
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

#### patient-service-service.yaml
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

#### payment-deployment.yaml
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

#### configmap.yaml
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

#### frontend.yaml
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

#### ingress.yaml
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

#### kustomization.yaml
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
<<<<<<< Updated upstream
=======
  - appointment-deployment.yaml
  - payment-deployment.yaml
>>>>>>> Stashed changes
  - frontend.yaml
  - ingress.yaml
```

#### namespace.yaml
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smart-health
```
