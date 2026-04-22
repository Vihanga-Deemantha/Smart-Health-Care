# Healio Smart Health Care Platform

Healio is a full-stack smart health care platform for patients, doctors, and administrators. It brings together user authentication, doctor verification, appointments, payments, telemedicine sessions, patient records, AI assistance, notifications, and operational admin dashboards in a microservices-based system.

The project is designed to run locally with Docker Compose and can also be deployed to Kubernetes using the manifests in `k8s/`.

## Table Of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Services And Ports](#services-and-ports)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Run With Docker Compose](#run-with-docker-compose)
- [Run Services Manually](#run-services-manually)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Testing And Quality Checks](#testing-and-quality-checks)
- [Useful URLs](#useful-urls)
- [API Gateway Routes](#api-gateway-routes)
- [Default Admin Seed](#default-admin-seed)
- [Troubleshooting](#troubleshooting)
- [Security Notes](#security-notes)
- [Documentation](#documentation)

## Project Overview

Healio Smart Health Care Platform is organized as a collection of focused services behind a central API Gateway. The React frontend communicates with the gateway, and the gateway forwards requests to the correct backend service.

The backend services are independent Node.js applications. They use MongoDB for data persistence, RabbitMQ for event-driven communication, Redis for appointment slot holds and job workflows, Cloudinary for document and image uploads, Stripe for payments, Gemini for AI chat, Jitsi for telemedicine rooms, and email/SMS/WhatsApp providers for notifications.

At a high level:

```text
User Browser
  |
  v
React Frontend + Nginx
  |
  v
API Gateway
  |
  +-- Auth Service
  +-- Admin Service
  +-- Patient Service
  +-- Doctor Service
  +-- Appointment Service
  +-- Payment Service
  +-- Telemedicine Service
  +-- AI Chatbot Service
  +-- Notification Service
  |
  +-- RabbitMQ
  +-- Redis
  +-- MongoDB databases
```

## Core Features

### Patient Experience

- Patient registration, login, OTP verification, password reset, and protected sessions.
- Patient profile management.
- Doctor discovery and appointment booking.
- Booking checkout and payment flow.
- Appointment history, upcoming bookings, and booking confirmation views.
- Medical report upload and management.
- Prescription viewing.
- AI health assistant chat.
- Access to telemedicine consultations.

### Doctor Experience

- Doctor registration and verification workflow.
- Availability and slot management.
- Pending, confirmed, and completed appointment views.
- Video consultation sessions.
- Prescription creation.
- Doctor profile and verification resubmission.
- Access to patient reports connected to appointments.

### Admin Experience

- Admin dashboard with platform analytics.
- User management.
- Pending doctor approval and rejection workflow.
- Admin profile settings.
- Admin management for super admins.
- Security and activity logs.

### Platform Capabilities

- JWT-based authentication and role-based authorization.
- API Gateway request routing and rate limiting.
- Event-driven notifications through RabbitMQ.
- Email, SMS, and WhatsApp notification support.
- Stripe payment integration.
- Gemini-powered AI chatbot service.
- Cloudinary uploads for reports, profile photos, and doctor documents.
- Docker Compose local orchestration.
- Kubernetes manifests for containerized deployment.

## Architecture

Healio follows a microservices architecture:

- The frontend is a React + Vite single-page application served by Nginx in Docker.
- The API Gateway exposes the public backend entry point and proxies `/api/*` routes.
- Each backend service owns a specific domain such as auth, patients, doctors, appointments, payments, notifications, or AI chat.
- RabbitMQ is used for asynchronous events such as notification publishing.
- Redis supports appointment-related workflows such as slot holds and background jobs.
- MongoDB is used by the services that persist domain data.

## Services And Ports

| Service | Purpose | Default Port | Path |
| --- | --- | ---: | --- |
| Frontend | React web app served through Nginx | `8080` | `frontend/` |
| API Gateway | Public backend gateway and reverse proxy | `5026` | `backend/api-gateway/` |
| Auth Service | Registration, login, OTP, JWT, admin seed | `5024` | `backend/auth-service/` |
| Admin Service | Admin dashboard, users, doctors, security logs | `5025` | `backend/admin-service/` |
| Appointment Service | Appointments, availability, waitlist, reminders, feedback | `5027` | `backend/services/appointment-service/` |
| Patient Service | Patient profiles, reports, patient records | `5028` | `backend/patient-service/` |
| Doctor Service | Doctor profiles, verification, availability, prescriptions | `5029` | `backend/doctor-service/` |
| AI Chatbot Service | Gemini-based health assistant | `5031` | `backend/ai-chatbot-service/` |
| Notification Service | Email, SMS, WhatsApp event processing | `5032` | `backend/notification-service/` |
| Telemedicine Service | Video session lifecycle and Jitsi room support | `5033` | `backend/telemedicine-service/` |
| Payment Service | Stripe payment intents and webhooks | `5034` | `backend/services/payment-service/` |
| RabbitMQ | Message broker and management dashboard | `5672`, `15672` | Docker image |
| Redis | Cache, slot holds, and queue support | `6379` | Docker image |

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- React Hook Form
- Zod
- Tailwind CSS
- Recharts
- Framer Motion
- Lucide React

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Express Validator
- Helmet, CORS, Morgan
- RabbitMQ with `amqplib`
- Redis with `ioredis`
- BullMQ
- Stripe
- Cloudinary
- Nodemailer
- Twilio
- Google Gemini API
- Jitsi Meet integration

### DevOps

- Docker
- Docker Compose
- Nginx
- Kubernetes
- Kustomize
- PowerShell helper scripts

## Repository Structure

```text
.
|-- backend/
|   |-- auth-service/
|   |-- admin-service/
|   |-- api-gateway/
|   |-- ai-chatbot-service/
|   |-- doctor-service/
|   |-- notification-service/
|   |-- patient-service/
|   |-- telemedicine-service/
|   `-- services/
|       |-- appointment-service/
|       `-- payment-service/
|-- docs/
|-- frontend/
|-- k8s/
|-- scripts/
|-- docker-compose.yml
|-- .env.docker.example
`-- README.md
```

## Prerequisites

Install these before running the project:

- Node.js 20 or newer is recommended.
- npm.
- Docker Desktop.
- Docker Compose.
- Git.
- A MongoDB connection string for each service database or access to your MongoDB Atlas cluster.
- Cloudinary account for document/profile/report uploads.
- Google Gemini API key for the AI chatbot service.
- Stripe account and API keys for payments.
- Email SMTP credentials for OTP and email notifications.
- Optional Twilio or Notify.lk credentials for SMS/WhatsApp notifications.
- Optional Kubernetes support in Docker Desktop if you want to use the `k8s/` manifests.

## Environment Setup

Create the root environment file from the Docker example:

```powershell
Copy-Item .\.env.docker.example .\.env
```

Then update `.env` with real values for your local setup.

Important root environment groups:

| Variable Group | Examples | Used By |
| --- | --- | --- |
| Ports | `AUTH_PORT`, `GATEWAY_PORT`, `FRONTEND_PORT` | Docker Compose service mapping |
| JWT | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Auth, gateway, protected services |
| Internal service auth | `INTERNAL_SERVICE_SECRET` | Service-to-service endpoints |
| MongoDB | `AUTH_MONGODB_URI`, `PATIENT_MONGODB_URI`, `DOCTOR_MONGODB_URI` | Backend data services |
| Email | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | OTP and notifications |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Upload workflows |
| Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` | AI chatbot |
| RabbitMQ | `RABBITMQ_URL`, `RABBITMQ_EXCHANGE` | Event publishing and consuming |
| Notifications | `NOTIFY_LK_*`, `TWILIO_*` | SMS and WhatsApp |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payment service |

The telemedicine service also expects its own env file because `docker-compose.yml` includes:

```yaml
env_file:
  - ./backend/telemedicine-service/.env
```

Create it with:

```powershell
Copy-Item .\backend\telemedicine-service\.env.example .\backend\telemedicine-service\.env
```

Then update `backend/telemedicine-service/.env`, especially:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `INTERNAL_SERVICE_SECRET`
- `PATIENT_SERVICE_URL`
- `DOCTOR_SERVICE_URL`
- `RABBITMQ_URL`
- `JITSI_BASE_URL`

For local frontend development outside Docker, create:

```powershell
Copy-Item .\frontend\.env.example .\frontend\.env
```

Default frontend development API setting:

```env
VITE_API_BASE_URL=http://localhost:5026/api
```

## Run With Docker Compose

Build and start the full platform:

```powershell
docker compose up --build -d
```

Open the app:

```text
http://localhost:8080
```

Check the API Gateway:

```text
http://localhost:5026/health
```

Open RabbitMQ management:

```text
http://localhost:15672
```

Default RabbitMQ local login:

```text
guest / guest
```

View running containers:

```powershell
docker compose ps
```

Follow logs for all services:

```powershell
docker compose logs -f
```

Follow logs for one service:

```powershell
docker compose logs -f api-gateway
```

Stop the stack:

```powershell
docker compose down
```

Rebuild one service after code changes:

```powershell
docker compose build auth-service
docker compose up -d auth-service
```

## Run Services Manually

Docker Compose is the easiest way to run the complete platform. For focused service development, install dependencies and start only the service you are editing.

Start infrastructure only:

```powershell
docker compose up -d rabbitmq redis
```

Install and run the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Install and run a backend service:

```powershell
cd backend/auth-service
npm install
npm run dev
```

Each backend service has its own `package.json`, so repeat the same pattern inside the service folder you are working on.

Common service scripts:

| Script | Meaning |
| --- | --- |
| `npm run dev` | Start service with `nodemon` where configured |
| `npm start` | Start service with Node.js |
| `npm test` | Run service tests where configured |
| `npm run build` | Build frontend production bundle |
| `npm run lint` | Run frontend linting |

## Kubernetes Deployment

Kubernetes files are in `k8s/`, with command notes in `k8s/COMMANDS.md`.

Enable Kubernetes in Docker Desktop:

```text
Docker Desktop -> Settings -> Kubernetes -> Enable Kubernetes -> Apply & Restart
```

Generate the local Kubernetes secret from your root `.env`:

```powershell
.\scripts\generate-k8s-secret.ps1
```

Build images:

```powershell
docker compose build
```

Apply manifests:

```powershell
kubectl apply -k .\k8s
```

Wait for pods:

```powershell
kubectl wait --for=condition=ready pod --all -n smart-health --timeout=180s
```

Check resources:

```powershell
kubectl get pods -n smart-health
kubectl get svc -n smart-health
kubectl get deploy -n smart-health
```

Open the frontend through port forwarding:

```powershell
kubectl port-forward svc/frontend 8081:80 -n smart-health
```

Then open:

```text
http://localhost:8081
```

Open the API Gateway:

```powershell
kubectl port-forward svc/api-gateway 5026:5026 -n smart-health
```

Then visit:

```text
http://localhost:5026/health
```

Remove the Kubernetes deployment:

```powershell
kubectl delete -k .\k8s
```

## Testing And Quality Checks

Run frontend linting:

```powershell
cd frontend
npm run lint
```

Build the frontend:

```powershell
cd frontend
npm run build
```

Run Auth Service tests:

```powershell
cd backend/auth-service
npm test
```

Run Admin Service tests:

```powershell
cd backend/admin-service
npm test
```

Run Appointment Service tests:

```powershell
cd backend/services/appointment-service
npm test
```

The repository also contains Postman collections and service-specific testing notes in `docs/`.

## Useful URLs

When running with Docker Compose defaults:

| URL | Purpose |
| --- | --- |
| `http://localhost:8080` | Frontend app |
| `http://localhost:5026/health` | API Gateway health |
| `http://localhost:5024/health` | Auth Service health |
| `http://localhost:5025/health` | Admin Service health |
| `http://localhost:5027/health` | Appointment Service health |
| `http://localhost:5028/health` | Patient Service health |
| `http://localhost:5029/health` | Doctor Service health |
| `http://localhost:5031/health` | AI Chatbot Service health |
| `http://localhost:5032/health` | Notification Service health |
| `http://localhost:5033/health` | Telemedicine Service health |
| `http://localhost:5034/health` | Payment Service health |
| `http://localhost:15672` | RabbitMQ management UI |

## API Gateway Routes

The API Gateway exposes these main route groups:

| Gateway Route | Target Service |
| --- | --- |
| `/api/auth` | Auth Service |
| `/api/admin` | Admin Service |
| `/api/patients` | Patient Service |
| `/api/doctors` | Doctor Service |
| `/api/appointments` | Appointment Service |
| `/api/feedback` | Appointment Service |
| `/api/feedback/doctors` | Appointment Service |
| `/api/waitlist` | Appointment Service |
| `/api/emergency-alerts` | Appointment Service |
| `/api/emergency-resources` | Appointment Service |
| `/api/notifications` | Appointment Service |
| `/api/sessions` | Telemedicine Service |
| `/api/prescriptions` | Doctor Service |
| `/api/payments` | Payment Service |
| `/api/ai` | AI Chatbot Service |

Most routes are protected by JWT authentication through the gateway. Public routes include authentication, doctor discovery, doctor feedback discovery, and emergency resources.

## Default Admin Seed

The Auth Service includes a seed script for creating a super admin user:

```powershell
cd backend/auth-service
npm run seed:admin
```

Seeded account:

```text
Email: admin@smarthealth.com
Password: Admin@12345
Role: SUPER_ADMIN
```

Change this password immediately in any shared or production-like environment.

## Troubleshooting

### Docker Compose Build Fails

Run:

```powershell
docker compose build --no-cache
```

Then restart:

```powershell
docker compose up -d
```

### Frontend Cannot Reach The API

Check that the gateway is healthy:

```text
http://localhost:5026/health
```

For local Vite development, confirm `frontend/.env` contains:

```env
VITE_API_BASE_URL=http://localhost:5026/api
```

For Docker, the frontend Nginx config proxies `/api/` to `api-gateway:5026`.

### MongoDB Connection Errors

Check that the service-specific MongoDB URI is present and valid in `.env`:

```env
AUTH_MONGODB_URI=...
PATIENT_MONGODB_URI=...
DOCTOR_MONGODB_URI=...
```

Each service uses its own database connection string.

### Telemedicine Container Fails To Start

Make sure this file exists:

```text
backend/telemedicine-service/.env
```

Create it from:

```powershell
Copy-Item .\backend\telemedicine-service\.env.example .\backend\telemedicine-service\.env
```

### Notification Events Are Not Processing

Check RabbitMQ and notification logs:

```powershell
docker compose logs -f rabbitmq
docker compose logs -f notification-service
```

Confirm these values match across services:

```env
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_EXCHANGE=smart_health.events
```

### Kubernetes Pods Are Stuck

Check pod status:

```powershell
kubectl get pods -n smart-health
```

Read logs:

```powershell
kubectl logs deploy/<service-name> -n smart-health --tail=100
```

Describe a failing pod:

```powershell
kubectl describe pod -l app=<service-name> -n smart-health
```

Regenerate secrets after `.env` changes:

```powershell
.\scripts\generate-k8s-secret.ps1
kubectl apply -k .\k8s
```

## Security Notes

- Never commit real `.env` files or real Kubernetes secrets.
- Replace all `change-me` values before running outside a personal local setup.
- Use strong, unique JWT secrets and internal service secrets.
- Rotate seeded admin credentials before sharing the system.
- Use HTTPS and secure cookies in production.
- Keep Stripe webhook secrets private.
- Restrict Cloudinary upload presets and API keys.
- Restrict MongoDB access by IP and user permissions.

## Documentation

Additional project documentation lives in `docs/` and `k8s/`:

| File | Purpose |
| --- | --- |
| `k8s/COMMANDS.md` | Step-by-step Kubernetes command guide |
| `k8s/README.md` | Kubernetes deployment overview |
| `docs/DOCTOR-SERVICE-TESTING-GUIDE.md` | Doctor service testing guide |
| `docs/DOCTOR-SERVICE-TEST-QUICK-REFERENCE.md` | Doctor service quick reference |
| `docs/Doctor-Service-API-Postman-Collection.json` | Doctor service Postman collection |
| `docs/Smart-Health-Doctor-Appointment-Testing.postman_collection.json` | Appointment testing Postman collection |
| `docs/auth-notification-events.md` | Auth and notification event notes |
| `docs/patient-ai-implementation-report.md` | Patient AI implementation notes |
| `docs/report.md` | General project report |

## Project Name

```text
Healio Smart Health Care Platform
```

Built as a modern, service-oriented health care platform for smarter patient care, better doctor workflows, and clearer administration.
