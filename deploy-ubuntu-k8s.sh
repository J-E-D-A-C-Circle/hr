#!/bin/bash
# ==============================================================================
# DVLA NSS Portal - Ubuntu Kubernetes Deployment Helper Script
# ==============================================================================

set -e

echo "============================================================"
echo "🚀 Starting DVLA NSS Portal Kubernetes Deployment"
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
echo "🏷️ Deployment Image Tag: nss-portal-app:$BUILD_TAG"

# Prune stale Docker build cache to free up disk space
echo "🧹 Pruning stale Docker build cache & dangling images..."
docker builder prune -f 2>/dev/null || true
docker image prune -f 2>/dev/null || true

# Build Docker image without stale cache
echo "🔨 Building Docker image (fresh build)..."
docker build --no-cache -t nss-portal-app:$BUILD_TAG -t nss-portal-app:latest .

# Dynamically locate K3s or kubectl binary
K3S_PATH=$(which k3s 2>/dev/null || find /usr -name k3s 2>/dev/null | head -n 1 || echo "")
KUBECTL_PATH=$(which kubectl 2>/dev/null || find /usr -name kubectl 2>/dev/null | head -n 1 || echo "")

if [ -n "$K3S_PATH" ]; then
    echo "📦 Detected K3s at $K3S_PATH."
    echo "📥 Importing fresh Docker image into K3s (k8s.io containerd namespace)..."
    if sudo $K3S_PATH image import --help &> /dev/null 2>&1; then
        docker save nss-portal-app:$BUILD_TAG | sudo $K3S_PATH image import -
    else
        docker save nss-portal-app:$BUILD_TAG | sudo $K3S_PATH ctr -n k8s.io images import -
    fi
    KUBECTL="sudo $K3S_PATH kubectl"
elif command -v microk8s &> /dev/null; then
    echo "📦 Detected MicroK8s."
    microk8s ctr image build --no-cache -t nss-portal-app:$BUILD_TAG .
    KUBECTL="microk8s kubectl"
elif [ -n "$KUBECTL_PATH" ]; then
    echo "📦 Standard kubectl detected at $KUBECTL_PATH."
    KUBECTL="$KUBECTL_PATH"
else
    echo "❌ Error: Neither K3s nor kubectl was found on this server."
    echo "👉 To install K3s on this Ubuntu server, run:"
    echo "   curl -sfL https://get.k3s.io | sh -"
    exit 1
fi

echo "📄 Applying Kubernetes manifests using $KUBECTL..."
$KUBECTL apply -f k8s/namespace.yaml
$KUBECTL apply -f k8s/configmap.yaml
$KUBECTL apply -f k8s/secret.yaml
$KUBECTL apply -f k8s/pv-pvc.yaml
$KUBECTL apply -f k8s/mysql-deployment.yaml
$KUBECTL apply -f k8s/phpmyadmin-deployment.yaml
$KUBECTL apply -f k8s/deployment.yaml
$KUBECTL apply -f k8s/service.yaml

echo "⏳ Waiting for MySQL database initialization..."
$KUBECTL rollout status deployment/nss-mysql-app -n nss-portal --timeout=180s

echo "🔄 Pointing deployment to new image tag ($BUILD_TAG) and forcing fresh pod rollout..."
$KUBECTL set image deployment/nss-portal-app nss-portal=nss-portal-app:$BUILD_TAG -n nss-portal 2>/dev/null || true
$KUBECTL rollout restart deployment/nss-portal-app -n nss-portal 2>/dev/null || true

echo "⏳ Waiting for DVLA NSS Portal app rollout..."
$KUBECTL rollout status deployment/nss-portal-app -n nss-portal --timeout=180s

echo "============================================================"
echo "✅ DVLA NSS Portal successfully deployed to Kubernetes!"
echo "============================================================"
echo "Access points:"
echo "  - Web Portal: http://<YOUR_UBUNTU_SERVER_IP>:5000"
echo "  - phpMyAdmin: http://<YOUR_UBUNTU_SERVER_IP>:30881"
echo "  - MySQL NodePort: <YOUR_UBUNTU_SERVER_IP>:30306"
echo "============================================================"

