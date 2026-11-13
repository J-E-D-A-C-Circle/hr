#!/bin/bash
# ==============================================================================
# HR Validation System - Ubuntu Kubernetes Deployment Helper Script
# Full stack: Next.js Platform + Dedicated MySQL 8.0 + phpMyAdmin
# ==============================================================================

set -e

echo "============================================================"
echo "🚀 Starting HR Validation System Kubernetes Deployment"
echo "============================================================"

# Report Git details if running in a Git repository
if git rev-parse --is-inside-work-tree &>/dev/null; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "🔄 Fetching latest changes for branch: $CURRENT_BRANCH..."
    git fetch origin $CURRENT_BRANCH || echo "⚠️ Failed to fetch from origin"
    git reset --hard origin/$CURRENT_BRANCH || echo "⚠️ Failed to reset to origin/$CURRENT_BRANCH"
    
    CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    echo "🌿 Server Git Branch: $CURRENT_BRANCH ($CURRENT_COMMIT)"
    echo "------------------------------------------------------------"
fi

# Generate a unique build tag for this deployment
BUILD_TAG="build-$(date +%Y%m%d%H%M%S)"
echo "🏷️ Deployment Image Tag: hr-validation-app:$BUILD_TAG"

# Prune past build tags & dangling images quietly
echo "🧹 Cleaning up old deployment images..."
docker images --format '{{.Repository}}:{{.Tag}}' | grep 'hr-validation-app:build-' | xargs -r docker rmi >/dev/null 2>&1 || true
docker image prune -f >/dev/null 2>&1 || true

# Build Docker image (utilizes Docker layer caching for fast builds)
echo "🔨 Building Docker image..."
docker build -t hr-validation-app:$BUILD_TAG -t hr-validation-app:latest .

# Dynamically locate K3s, MicroK8s, or standard kubectl binary
K3S_PATH=$(which k3s 2>/dev/null || find /usr -name k3s 2>/dev/null | head -n 1 || echo "")
KUBECTL_PATH=$(which kubectl 2>/dev/null || find /usr -name kubectl 2>/dev/null | head -n 1 || echo "")

if [ -n "$K3S_PATH" ]; then
    echo "📦 Detected K3s at $K3S_PATH."
    echo "📥 Importing fresh Docker image into K3s containerd namespace..."
    if sudo $K3S_PATH image import --help &> /dev/null 2>&1; then
        docker save hr-validation-app:$BUILD_TAG hr-validation-app:latest | sudo $K3S_PATH image import -
    else
        docker save hr-validation-app:$BUILD_TAG hr-validation-app:latest | sudo $K3S_PATH ctr -n k8s.io images import -
    fi
    KUBECTL="sudo $K3S_PATH kubectl"
elif command -v microk8s &> /dev/null; then
    echo "📦 Detected MicroK8s on server."
    microk8s ctr image build --no-cache -t hr-validation-app:$BUILD_TAG -t hr-validation-app:latest .
    KUBECTL="microk8s kubectl"
elif [ -n "$KUBECTL_PATH" ]; then
    echo "📦 Standard kubectl detected at $KUBECTL_PATH."
    KUBECTL="$KUBECTL_PATH"
else
    echo "❌ Error: Neither K3s, MicroK8s, nor kubectl was found on this server."
    echo "👉 If you want to run via Docker Compose instead:"
    echo "   docker compose up -d --build"
    exit 1
fi

echo "📄 Applying Kubernetes manifests using $KUBECTL..."
$KUBECTL delete pods -n hr-validation --field-selector status.phase=Failed 2>/dev/null || true
$KUBECTL delete pods -n hr-validation --field-selector status.phase=Succeeded 2>/dev/null || true
$KUBECTL apply -f k8s/namespace.yaml
$KUBECTL apply -f k8s/configmap.yaml
$KUBECTL apply -f k8s/secret.yaml
$KUBECTL apply -f k8s/pv-pvc.yaml
$KUBECTL apply -f k8s/mysql-deployment.yaml
$KUBECTL apply -f k8s/phpmyadmin-deployment.yaml
$KUBECTL apply -f k8s/deployment.yaml
$KUBECTL apply -f k8s/service.yaml

echo "🔄 Pointing app deployment to current image tag ($BUILD_TAG)..."
$KUBECTL set image deployment/hr-validation-app hr-validation=hr-validation-app:$BUILD_TAG -n hr-validation 2>/dev/null || true

echo "⏳ Waiting for MySQL database initialization..."
$KUBECTL rollout status deployment/hr-mysql-app -n hr-validation --timeout=300s || echo "⚠️ MySQL rollout taking longer than usual, proceeding to app rollout..."

echo "🔄 Forcing fresh pod rollout..."
$KUBECTL rollout restart deployment/hr-validation-app -n hr-validation 2>/dev/null || true

echo "⏳ Waiting for HR Validation app rollout to complete..."
if ! $KUBECTL rollout status deployment/hr-validation-app -n hr-validation --timeout=300s; then
    echo "⚠️ Rollout timed out or failed. Displaying recent pod logs:"
    $KUBECTL logs deployment/hr-validation-app -n hr-validation --tail=50 || true
    $KUBECTL describe pod -n hr-validation -l app=hr-validation-app | grep -A 15 "Events:" || true
    exit 1
fi

echo "============================================================"
echo "✅ HR Validation Platform successfully deployed to Kubernetes!"
echo "============================================================"
echo "Access points:"
echo "  - Web Portal: http://<YOUR_UBUNTU_SERVER_IP>:8080"
echo "  - phpMyAdmin: http://<YOUR_UBUNTU_SERVER_IP>:30881"
echo "  - MySQL NodePort: <YOUR_UBUNTU_SERVER_IP>:30306"
echo "============================================================"
