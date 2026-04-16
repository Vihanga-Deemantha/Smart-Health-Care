# Kubernetes Commands Guide

This guide is for running the Smart Health Care project on Docker Desktop Kubernetes.

## 1. First-Time Setup

Enable Kubernetes in Docker Desktop:

```text
Docker Desktop -> Settings -> Kubernetes -> Enable Kubernetes -> Apply & Restart
```

Check Docker is running:

```powershell
docker version
```

Check Kubernetes CLI is installed:

```powershell
kubectl version --client
```

Check your current Kubernetes context:

```powershell
kubectl config current-context
```

For Docker Desktop, it should usually show:

```text
docker-desktop
```

Check the cluster is reachable:

```powershell
kubectl cluster-info
```

## 2. Run The App In Kubernetes

Generate the local Kubernetes secret from your root `.env`:

```powershell
.\scripts\generate-k8s-secret.ps1
```

Build all Docker images:

```powershell
docker compose build
```

Apply Kubernetes manifests:

```powershell
kubectl apply -k .\k8s
```

Wait for all pods to become ready:

```powershell
kubectl wait --for=condition=ready pod --all -n smart-health --timeout=180s
```

Check pods:

```powershell
kubectl get pods -n smart-health
```

Check services:

```powershell
kubectl get svc -n smart-health
```

Check deployments:

```powershell
kubectl get deploy -n smart-health
```

## 3. Open The App

Forward the frontend service to your machine:

```powershell
kubectl port-forward svc/frontend 8081:80 -n smart-health
```

Keep that terminal open.

Open:

```text
http://localhost:8081
```

If port `8081` is busy:

```powershell
kubectl port-forward svc/frontend 8082:80 -n smart-health
```

Open:

```text
http://localhost:8082
```

## 4. Open The API Gateway

Forward the API Gateway:

```powershell
kubectl port-forward svc/api-gateway 5026:5026 -n smart-health
```

Open:

```text
http://localhost:5026/health
```

## 5. Open RabbitMQ Dashboard

Forward RabbitMQ management UI:

```powershell
kubectl port-forward svc/rabbitmq 15672:15672 -n smart-health
```

Open:

```text
http://localhost:15672
```

Default local login:

```text
guest / guest
```

## 6. Daily Update Flow

Use this after pulling code changes or editing manifests:

```powershell
.\scripts\generate-k8s-secret.ps1
docker compose build
kubectl apply -k .\k8s
kubectl wait --for=condition=ready pod --all -n smart-health --timeout=180s
kubectl get pods -n smart-health
```

## 7. Update One Service After Code Changes

Example for `auth-service`:

```powershell
docker compose build auth-service
kubectl rollout restart deploy/auth-service -n smart-health
kubectl rollout status deploy/auth-service -n smart-health
kubectl logs deploy/auth-service -n smart-health --tail=100
```

Example for `frontend`:

```powershell
docker compose build frontend
kubectl rollout restart deploy/frontend -n smart-health
kubectl rollout status deploy/frontend -n smart-health
```

Example for `api-gateway`:

```powershell
docker compose build api-gateway
kubectl rollout restart deploy/api-gateway -n smart-health
kubectl rollout status deploy/api-gateway -n smart-health
```

## 8. Debug Commands

List pods:

```powershell
kubectl get pods -n smart-health
```

View logs:

```powershell
kubectl logs deploy/<service-name> -n smart-health --tail=100
```

Follow logs live:

```powershell
kubectl logs deploy/<service-name> -n smart-health -f
```

Describe a failing pod:

```powershell
kubectl describe pod -l app=<service-name> -n smart-health
```

Check previous crash logs:

```powershell
kubectl logs deploy/<service-name> -n smart-health --previous --tail=100
```

Restart a service:

```powershell
kubectl rollout restart deploy/<service-name> -n smart-health
```

Check rollout:

```powershell
kubectl rollout status deploy/<service-name> -n smart-health
```

## 9. Current Service Names

Use these names in commands:

```text
auth-service
admin-service
patient-service
appointment-service
doctor-service
payment-service
notification-service
ai-chatbot-service
api-gateway
frontend
rabbitmq
redis
```

Example:

```powershell
kubectl logs deploy/notification-service -n smart-health --tail=100
```

## 10. Add A New Microservice To Kubernetes

Step 1: Add the service to `docker-compose.yml`.

Step 2: Create a Kubernetes manifest:

```powershell
New-Item -ItemType File -Path .\k8s\new-service.yaml
```

Step 3: Add a Deployment and Service to `k8s/new-service.yaml`.

Minimal example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: new-service
  namespace: smart-health
spec:
  replicas: 1
  selector:
    matchLabels:
      app: new-service
  template:
    metadata:
      labels:
        app: new-service
    spec:
      containers:
        - name: new-service
          image: smart-health-care-new-service:latest
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 5035
          env:
            - name: PORT
              value: "5035"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: smart-health-config
                  key: NODE_ENV
---
apiVersion: v1
kind: Service
metadata:
  name: new-service
  namespace: smart-health
spec:
  selector:
    app: new-service
  ports:
    - port: 5035
      targetPort: 5035
```

Step 4: Add the new file to `k8s/kustomization.yaml`:

```yaml
resources:
  - new-service.yaml
```

Step 5: Add non-secret values to `k8s/configmap.yaml`.

Example:

```yaml
NEW_SERVICE_URL: http://new-service:5035
```

Step 6: If the service needs secrets, add keys to root `.env`.

Example:

```env
NEW_SERVICE_MONGODB_URI=mongodb+srv://...
NEW_SERVICE_API_KEY=...
```

Step 7: Add placeholder keys to `k8s/secret.example.yaml`.

Example:

```yaml
NEW_SERVICE_MONGODB_URI: replace-with-new-service-mongodb-uri
NEW_SERVICE_API_KEY: replace-with-new-service-api-key
```

Step 8: Add those keys to `scripts/generate-k8s-secret.ps1`.

Add them to:

```powershell
$requiredKeys = @(
  "NEW_SERVICE_MONGODB_URI",
  "NEW_SERVICE_API_KEY"
)
```

Step 9: Generate the real local secret:

```powershell
.\scripts\generate-k8s-secret.ps1
```

Step 10: Build and apply:

```powershell
docker compose build new-service
kubectl apply -k .\k8s
kubectl rollout status deploy/new-service -n smart-health
kubectl logs deploy/new-service -n smart-health --tail=100
```

## 11. If API Gateway Must Route To The New Service

Update API Gateway code:

```text
backend/api-gateway/app.js
```

Add the service URL to `k8s/configmap.yaml`:

```yaml
NEW_SERVICE_URL: http://new-service:5035
```

Add the env var to `k8s/api-gateway.yaml`.

Rebuild and restart API Gateway:

```powershell
docker compose build api-gateway
kubectl apply -k .\k8s
kubectl rollout restart deploy/api-gateway -n smart-health
kubectl rollout status deploy/api-gateway -n smart-health
```

## 12. Remove The Kubernetes Deployment

Delete everything created by the `k8s` folder:

```powershell
kubectl delete -k .\k8s
```

Check namespace resources:

```powershell
kubectl get all -n smart-health
```

## 13. Common Problems

If pods are stuck in `ImagePullBackOff`, rebuild images:

```powershell
docker compose build
kubectl rollout restart deploy/<service-name> -n smart-health
```

If pods are stuck in `CrashLoopBackOff`, check logs:

```powershell
kubectl logs deploy/<service-name> -n smart-health --previous --tail=100
```

If frontend cannot open, run port-forward again:

```powershell
kubectl port-forward svc/frontend 8081:80 -n smart-health
```

If notification events are not working, check RabbitMQ and notification logs:

```powershell
kubectl logs deploy/rabbitmq -n smart-health --tail=100
kubectl logs deploy/notification-service -n smart-health --tail=100
kubectl logs deploy/auth-service -n smart-health --tail=100
```

If you changed `.env`, regenerate the Kubernetes secret and restart affected services:

```powershell
.\scripts\generate-k8s-secret.ps1
kubectl apply -k .\k8s
kubectl rollout restart deploy/<service-name> -n smart-health
```
