# Telemedicine Service Report (Current State)

Generated: 2026-04-17
Scope: backend/telemedicine-service

## 1. Purpose and scope
- Provides telemedicine sessions tied to confirmed appointments.
- Generates Jitsi room URLs and stores session metadata in MongoDB.
- Exposes APIs for joining, ending, cancelling, and listing sessions.
- Integrates with RabbitMQ to consume appointment confirmation events and to publish notification events.

## 2. Service architecture
- Runtime: Node.js (ES modules) with Express.
- Persistence: MongoDB via Mongoose.
- Messaging: RabbitMQ via amqplib (topic exchange).
- External video provider: Jitsi Meet (URL based, no API key required).

## 3. Runtime and dependencies
Primary dependencies (from package.json):
- express: HTTP server and routing.
- mongoose: MongoDB ODM.
- amqplib: RabbitMQ connection, publish, consume.
- jsonwebtoken: JWT verification for auth.
- helmet: HTTP security headers.
- cors: CORS configuration.
- express-rate-limit: API request throttling.
- morgan: HTTP request logging.
- winston: application logging.
- uuid: unique room name suffixes.
- dotenv: environment variable loading.

Scripts:
- npm run start: node src/server.js
- npm run dev: nodemon src/server.js

Container:
- Docker image uses node:20-alpine, exposes port 5033, runs src/server.js.

## 4. Configuration (env)
Defined in .env.example and read via dotenv:

| Variable | Purpose | Default/Notes |
| --- | --- | --- |
| PORT | HTTP port | 5033 if unset |
| NODE_ENV | Runtime environment | development in example |
| CLIENT_URL | Allowed CORS origin | If unset, all origins allowed |
| MONGODB_URI | MongoDB connection string | Required |
| JWT_ACCESS_SECRET | JWT verify secret | Required for auth |
| INTERNAL_SERVICE_SECRET | Shared secret for internal routes | Required for internal API |
| RABBITMQ_URL | RabbitMQ connection | Required for messaging |
| RABBITMQ_EXCHANGE | Topic exchange name | smart_health.events default |
| JITSI_BASE_URL | Jitsi URL base | https://meet.jit.si default |
| LOG_LEVEL | Logger verbosity | info default |
| RABBITMQ_RETRY_MS | Retry interval for consumer | 5000 ms default |

## 5. Data model: Session
MongoDB collection: Session (Mongoose model)

Fields:
- appointmentId (String, required, unique)
- channelName (String, required, unique)
- jitsiRoomUrl (String)
- provider (String, default: jitsi)
- patientId (String, required)
- doctorId (String, required)
- patientName (String)
- doctorName (String)
- specialty (String)
- scheduledAt (Date)
- status (enum: scheduled, waiting, active, completed, cancelled; default scheduled)
- waitingStartedAt (Date)
- sessionStartedAt (Date)
- sessionEndedAt (Date)
- durationMinutes (Number)
- sessionOutcome (enum: completed, no_show, technical_issue)
- notes (String)
- createdBy (String)
- timestamps: createdAt, updatedAt

Virtuals:
- isJoinable: true only if current time is between 10 minutes before scheduledAt and 60 minutes after scheduledAt.

## 6. API surface (HTTP routes)
Response format is consistently JSON with { success: true/false, ... }.

Public:
- GET /health
  - No auth
  - Returns service status and database connection state.

Authenticated (JWT):
- POST /api/sessions
  - Roles: DOCTOR, ADMIN
  - Creates a session manually and publishes notification.appointment.confirmed.
- POST /api/sessions/:sessionId/join
  - Roles: DOCTOR, PATIENT
  - Returns Jitsi room URL if within joinable window.
- PUT /api/sessions/:sessionId/end
  - Roles: DOCTOR, PATIENT
  - Completes session, sets duration, publishes notification.telemedicine.session.completed.
- PUT /api/sessions/:sessionId/cancel
  - Roles: ADMIN
  - Cancels session, publishes notification.telemedicine.session.cancelled.
- GET /api/sessions/:sessionId
  - Any authenticated user with access (admin or participant)
  - Returns full session document.
- GET /api/sessions/appointment/:appointmentId
  - Any authenticated user with access (admin or participant)
  - Returns session by appointment ID.
- GET /api/sessions/doctor/my-sessions
  - Roles: DOCTOR
  - Lists sessions for doctor with pagination and optional status filter.
- GET /api/sessions/patient/my-sessions
  - Roles: PATIENT
  - Lists sessions for patient with pagination and optional status filter.

Internal:
- GET /internal/sessions/appointment/:appointmentId
  - Requires header x-internal-service-secret matching INTERNAL_SERVICE_SECRET.
  - Returns session by appointment ID for internal services.

## 7. Business logic (controller methods)
- createSession
  - Validates appointmentId, patientId, doctorId.
  - Generates channelName and Jitsi URL, creates Session in DB.
  - Publishes notification.appointment.confirmed with session details.
- joinSession
  - Ensures requester is patient or doctor and session is joinable.
  - Transitions status from scheduled to waiting, sets waitingStartedAt and sessionStartedAt.
  - Returns Jitsi room URL and metadata.
- endSession
  - Ensures requester is participant; marks completed.
  - Calculates durationMinutes if sessionStartedAt exists.
  - Publishes notification.telemedicine.session.completed.
- cancelSession
  - Admin only; marks cancelled.
  - Publishes notification.telemedicine.session.cancelled.
- getSession / getSessionByAppointment
  - Admin or participant access only.
  - Returns session with virtuals.
- getDoctorSessions / getPatientSessions
  - Paged list by doctorId or patientId; optional status filter.
- getInternalSessionByAppointment
  - Used by internal services without JWT.

## 8. Eventing and async workflow
Consumer (RabbitMQ):
- Routing key: appointment.confirmed
- Queue: telemedicine_appointment_confirmed
- Behavior:
  - Creates a Session if one does not already exist for the appointment.
  - scheduledAt is derived from payload.scheduledAt, payload.startTime, or payload.appointmentDate.
  - Publishes notification.appointment.confirmed after creation.

Publishers:
- notification.appointment.confirmed
  - Emitted on manual creation and on appointment.confirmed consumption.
- notification.telemedicine.session.completed
  - Emitted on session end.
- notification.telemedicine.session.cancelled
  - Emitted on session cancel.

Reliability notes:
- Exchange and queues are durable.
- Message publish is persistent with contentType application/json.
- Consumer errors nack without requeue.
- Reconnect and retry logic for RabbitMQ consumer with configurable delay.

## 9. Middleware and security
- Helmet for security headers.
- CORS with credentials enabled; origin is CLIENT_URL or all origins if unset.
- Rate limiting on /api: 100 requests per 15 minutes.
- JWT auth via Authorization: Bearer <token>.
- Role-based authorization for sensitive routes.
- Internal route protected by x-internal-service-secret header.

## 10. Operational behavior
- Startup sequence:
  1) Load env via dotenv
  2) Configure Express middleware and routes
  3) Connect to MongoDB
  4) Start HTTP server
  5) Start RabbitMQ consumer
- Error handling:
  - 404 handler for unknown routes.
  - Central error handler returns JSON and logs errors.
- Health check:
  - /health returns database connection status using mongoose.readyState.

## 11. Docker packaging
- Base image: node:20-alpine
- Uses npm ci --omit=dev for production deps
- Exposes port 5033

## 12. Observed gaps and notes
- No automated test suite is present in this service folder.
- No OpenAPI/Swagger documentation is generated.
- Session status active is never assigned; transitions are scheduled -> waiting -> completed/cancelled.
- No event is published for session start/join.
- Join window depends on scheduledAt; sessions without scheduledAt cannot be joined.
- Input validation is minimal (basic required-field checks only).
