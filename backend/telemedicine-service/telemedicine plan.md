<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# okay now use Jitsi Meet  and now give me plan to develop telemedicine service area now read both aour project docs and undertand

Now I have the full picture from both docs. Here is the complete, tailored development plan:

***

# 🏥 Telemedicine Microservice — Full Development Plan

## (Based on Your Project Docs — Port 5033, Jitsi Meet)


***

## 📌 How It Fits Into YOUR Existing System

Reading your docs, here is exactly how your telemedicine service plugs in:[^1][^2]

```
appointment-service  ──── publishes ──►  appointment.confirmed (RabbitMQ)
                                                  │
                                                  ▼
                                    telemedicine-service (PORT 5033)
                                    ● creates Jitsi room URL
                                    ● saves Session to MongoDB
                                    ● publishes notification.appointment.confirmed
                                                  │
                          ┌───────────────────────┤
                          ▼                       ▼
                   notification-service    doctor-service
                   (sends SMS/email)       GET /api/appointments/:id/telemedicine
                                                  │
                                    ┌─────────────┘
                                    ▼
                             React Frontend
                        Doctor Dashboard  +  Patient Dashboard
                        (Jitsi iframe embedded)
```


***

## 📁 Folder Structure

```
backend/telemedicine-service/       ← Port 5033 (matches your configmap.yaml)
├── src/
│   ├── config/
│   │   ├── db.js                   ← MongoDB connect
│   │   └── rabbitmq.js             ← connect + publish + subscribe
│   ├── controllers/
│   │   └── sessionController.js    ← all business logic
│   ├── middleware/
│   │   └── auth.js                 ← JWT verify (uses JWT_ACCESS_SECRET)
│   ├── models/
│   │   └── Session.js              ← MongoDB schema
│   ├── routes/
│   │   ├── sessionRoutes.js
│   │   └── healthRoutes.js
│   ├── utils/
│   │   └── logger.js
│   └── server.js
├── .env
├── .env.example
├── package.json
├── Dockerfile
└── k8s/
    ├── deployment.yaml
    └── service.yaml
```


***

## 🗄️ MongoDB Schema — `Session`

Matches the `Appointment.telemedicine` field in your **appointment-service** (`meetingLink`, `provider`, `calendarEventId`):[^1]

```js
// Session.js
{
  appointmentId:    String,   // links to appointment-service
  channelName:      String,   // unique room name e.g. "appt_abc123_x7k2"
  jitsiRoomUrl:     String,   // "https://meet.jit.si/{channelName}"
  provider:         String,   // default: "jitsi"

  patientId:        String,
  doctorId:         String,
  patientName:      String,
  doctorName:       String,
  specialty:        String,
  scheduledAt:      Date,

  status: {
    type: String,
    enum: ['scheduled','waiting','active','completed','cancelled'],
    default: 'scheduled'
  },

  sessionStartedAt: Date,
  sessionEndedAt:   Date,
  durationMinutes:  Number,
  sessionOutcome:   String,   // 'completed' | 'no_show' | 'technical_issue'
  notes:            String,

  createdBy:        String,   // 'event:appointment.confirmed'
  timestamps: true
}
```


***

## 🌐 API Routes

These match exactly what your **doctor-service** already calls at `GET /api/appointments/:id/telemedicine` and what **appointment-service** calls via `TELEMEDICINE_SERVICE_URL`:[^1]


| Method | Endpoint | Auth | Who Calls It |
| :-- | :-- | :-- | :-- |
| `GET` | `/health` | No | Kubernetes probe |
| `POST` | `/api/sessions` | JWT (Doctor/Admin) | Manual creation |
| `POST` | `/api/sessions/:id/join` | JWT (Doctor/Patient) | Doctor \& Patient dashboards |
| `PUT` | `/api/sessions/:id/end` | JWT (Doctor/Patient) | End call button |
| `PUT` | `/api/sessions/:id/cancel` | JWT (Admin) | Admin panel |
| `GET` | `/api/sessions/:id` | JWT | Any dashboard |
| `GET` | `/api/sessions/appointment/:appointmentId` | JWT | Doctor-service telemedicine lookup |
| `GET` | `/api/sessions/doctor/my-sessions` | JWT (Doctor) | Doctor dashboard list |
| `GET` | `/api/sessions/patient/my-sessions` | JWT (Patient) | Patient dashboard list |
| `GET` | `/internal/sessions/appointment/:appointmentId` | Internal secret | appointment-service internal call |


***

## 📨 RabbitMQ Events — Aligned to YOUR System

Your notification-service listens for `notification.#` binding key. So your telemedicine service must publish with `notification.` prefix:[^1]


| Direction | Event Key | When |
| :-- | :-- | :-- |
| **LISTENS TO** | `appointment.confirmed` | Auto-create session when doctor accepts |
| **PUBLISHES** | `notification.appointment.confirmed` | Triggers notification-service → sends SMS/email to both |
| **PUBLISHES** | `notification.telemedicine.session.started` | Both joined — notify |
| **PUBLISHES** | `notification.telemedicine.session.completed` | Session ended |

> ⚠️ **Important:** Your notification-service already listens for `notification.appointment.confirmed`  — so when telemedicine publishes this, the patient and doctor automatically get their "Your video consultation is ready" SMS/email **without any new code in notification-service**.[^1]

***

## 🔑 Environment Variables

Matches your project's existing pattern and `configmap.yaml`:[^1]

```env
PORT=5033
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB — separate DB like all other services
MONGODB_URI=mongodb+srv://...telemedicinedb...

# JWT — same secret as all services
JWT_ACCESS_SECRET=your_shared_jwt_secret

# Internal calls
INTERNAL_SERVICE_SECRET=your_internal_secret

# RabbitMQ — same as all services
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_EXCHANGE=smart_health.events

# Jitsi — No API key needed!
JITSI_BASE_URL=https://meet.jit.si
```


***

## 🐳 Dockerfile

Matches the pattern of all your other services:[^1]

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 5033
CMD ["node", "src/server.js"]
```


***

## ☸️ Kubernetes Manifests

Matches your `configmap.yaml` which already has `TELEMEDICINESERVICEURL=http://telemedicine-service:5033`:[^1]

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemedicine-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: telemedicine-service
  template:
    metadata:
      labels:
        app: telemedicine-service
    spec:
      containers:
        - name: telemedicine-service
          image: smart-health-care-telemedicine-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5033
          env:
            - name: PORT
              value: "5033"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
            - name: MONGODB_URI
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: TELEMEDICINE_MONGODB_URI
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
              port: 5033
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 5033
            initialDelaySeconds: 20
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: telemedicine-service
  namespace: smart-health
spec:
  selector:
    app: telemedicine-service
  ports:
    - port: 5033
      targetPort: 5033
```


***

## ✅ Development Steps (Order to Code)

| Step | What to Build | Time |
| :-- | :-- | :-- |
| **1** | `package.json`, `.env`, folder structure | 10 min |
| **2** | `config/db.js` + `config/rabbitmq.js` | 15 min |
| **3** | `models/Session.js` | 10 min |
| **4** | `middleware/auth.js` (copy pattern from doctor-service) | 10 min |
| **5** | `controllers/sessionController.js` | 45 min |
| **6** | `routes/sessionRoutes.js` + `routes/healthRoutes.js` | 10 min |
| **7** | `server.js` + RabbitMQ consumer for `appointment.confirmed` | 20 min |
| **8** | `Dockerfile` | 5 min |
| **9** | `k8s/deployment.yaml` + `k8s/service.yaml` | 10 min |
| **10** | Add `TELEMEDICINE_MONGODB_URI` to your `configmap.yaml` | 5 min |

**Total: ~2.5 hours for the full microservice**

***

## 🔗 Also Add to api-gateway

Your `api-gateway` currently has NO proxy for `/api/sessions/*`. Add this one route:[^1]

```js
// In api-gateway routes
app.use('/api/sessions', authenticate, proxy(TELEMEDICINE_SERVICE_URL));
```


***

Want me to now **write all the actual code files** starting from Step 1? I can give you each file ready to copy-paste into your project.
<span style="display:none">[^3]</span>

<div align="center">⁂</div>

[^1]: report.md

[^2]: DS_Assignment_Group_Division.docx

[^3]: DS-SE3020-_Assignment-1_Y3S1_2026.pdf

