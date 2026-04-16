# Kubernetes Deployment

This project includes Kubernetes manifests for the Smart Care Health platform.

## Services

- `auth-service`
- `admin-service`
- `patient-service`
- `appointment-service`
- `doctor-service`
- `payment-service`
- `notification-service`
- `ai-chatbot-service`
- `api-gateway`
- `rabbitmq`
- `redis`
- `frontend`

The Kubernetes setup uses the same service boundaries as the Docker Compose stack.

## Prerequisites

- A local or remote Kubernetes cluster
- `kubectl`
- Docker images built with the tags used by the manifests

## Image Tags

Build the application images with these tags:

```powershell
docker build -t smart-health-care-auth-service:latest .\backend\auth-service
docker build -t smart-health-care-admin-service:latest .\backend\admin-service
docker build -t smart-health-care-patient-service:latest .\backend\patient-service
docker build -t smart-health-care-appointment-service:latest .\backend\services\appointment-service
docker build -t smart-health-care-doctor-service:latest .\backend\doctor-service
docker build -t smart-health-care-payment-service:latest .\backend\services\payment-service
docker build -t smart-health-care-notification-service:latest .\backend\notification-service
docker build -t smart-health-care-ai-chatbot-service:latest .\backend\ai-chatbot-service
docker build -t smart-health-care-api-gateway:latest .\backend\api-gateway
docker build -t smart-health-care-frontend:latest .\frontend
```

If you are using `kind`, load the images into the cluster:

```powershell
kind load docker-image smart-health-care-auth-service:latest
kind load docker-image smart-health-care-admin-service:latest
kind load docker-image smart-health-care-patient-service:latest
kind load docker-image smart-health-care-appointment-service:latest
kind load docker-image smart-health-care-doctor-service:latest
kind load docker-image smart-health-care-payment-service:latest
kind load docker-image smart-health-care-notification-service:latest
kind load docker-image smart-health-care-ai-chatbot-service:latest
kind load docker-image smart-health-care-api-gateway:latest
kind load docker-image smart-health-care-frontend:latest
```

If you are using Minikube with its own Docker daemon, build the images after running:

```powershell
minikube docker-env --shell powershell | Invoke-Expression
```

## Configure Secrets

Do not commit real Kubernetes secrets. `k8s/secret.yaml` is intentionally ignored by git.

For local development, generate it from your root `.env`:

```powershell
.\scripts\generate-k8s-secret.ps1
```

Or create it manually from the safe template:

```powershell
Copy-Item .\k8s\secret.example.yaml .\k8s\secret.yaml
```

Then update the placeholder values in `k8s/secret.yaml` before deployment:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_SERVICE_SECRET`
- `AUTH_MONGODB_URI`
- `ADMIN_MONGODB_URI`
- `PATIENT_MONGODB_URI`
- `APPOINTMENT_MONGODB_URI`
- `PAYMENT_MONGODB_URI`
- `DOCTOR_MONGODB_URI`
- `NOTIFICATION_MONGODB_URI`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`
- `NOTIFY_LK_USER_ID`
- `NOTIFY_LK_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

Update non-secret runtime values such as service URLs, `CLIENT_URL`, RabbitMQ settings, and email host settings in `configmap.yaml` as needed.

## Deploy

```powershell
kubectl apply -k .\k8s
```

For a command-first beginner guide, see `k8s/COMMANDS.md`.

## Verify

```powershell
kubectl get pods -n smart-health
kubectl get svc -n smart-health
kubectl get ingress -n smart-health
```

## Notes

- The manifests are configured to use external MongoDB connection strings from `secret.yaml`.
- `TELEMEDICINE_SERVICE_URL` and `ROOM_SERVICE_URL` are configured as service URLs, but this repo does not include Kubernetes manifests for those services. Deploy them separately or point those URLs to real external services if those appointment features are needed.
- The ingress host is `smart-health.local`. Point that host to your ingress controller if you want browser access through the ingress.
