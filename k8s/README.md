# Kubernetes Deployment

This project includes Kubernetes manifests for the Smart Care Health platform.

## Services

- `auth-service`
- `admin-service`
- `patient-service`
- `ai-chatbot-service`
- `api-gateway`
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
docker build -t smart-health-care-ai-chatbot-service:latest .\backend\ai-chatbot-service
docker build -t smart-health-care-api-gateway:latest .\backend\api-gateway
docker build -t smart-health-care-frontend:latest .\frontend
```

If you are using `kind`, load the images into the cluster:

```powershell
kind load docker-image smart-health-care-auth-service:latest
kind load docker-image smart-health-care-admin-service:latest
kind load docker-image smart-health-care-patient-service:latest
kind load docker-image smart-health-care-ai-chatbot-service:latest
kind load docker-image smart-health-care-api-gateway:latest
kind load docker-image smart-health-care-frontend:latest
```

If you are using Minikube with its own Docker daemon, build the images after running:

```powershell
minikube docker-env --shell powershell | Invoke-Expression
```

## Configure Secrets

Update the placeholder values in `secret.yaml` before deployment:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_SERVICE_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GEMINI_API_KEY`

Update the database and client URLs in `configmap.yaml` as needed.

## Deploy

```powershell
kubectl apply -k .\k8s
```

## Verify

```powershell
kubectl get pods -n smart-health
kubectl get svc -n smart-health
kubectl get ingress -n smart-health
```

## Notes

- The manifests are configured to use external MongoDB connection strings from `configmap.yaml`.
- The ingress host is `smart-health.local`. Point that host to your ingress controller if you want browser access through the ingress.
