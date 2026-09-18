#!/bin/bash
# ==============================================================================
# DVLA NSS Portal - Ubuntu Kubernetes Deployment Helper Script
# ==============================================================================

set -e

echo "============================================================"
echo "🚀 Starting DVLA NSS Portal Kubernetes Deployment"
echo "============================================================"

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t nss-portal-app:latest .

# Dynamically locate K3s or kubectl binary
K3S_PATH=$(which k3s 2>/dev/null || find /usr -name k3s 2>/dev/null | head -n 1 || echo "")
KUBECTL_PATH=$(which kubectl 2>/dev/null || find /usr -name kubectl 2>/dev/null | head -n 1 || echo "")

if [ -n "$K3S_PATH" ]; then
    echo "📦 Detected K3s at $K3S_PATH."
    echo "📥 Importing Docker image into K3s (k8s.io containerd namespace)..."
    if sudo $K3S_PATH image import --help &> /dev/null 2>&1; then
        docker save nss-portal-app:latest | sudo $K3S_PATH image import -
    else
        docker save nss-portal-app:latest | sudo $K3S_PATH ctr -n k8s.io images import -
    fi
    KUBECTL="sudo $K3S_PATH kubectl"
elif command -v microk8s &> /dev/null; then
    echo "📦 Detected MicroK8s."
    microk8s ctr image build -t nss-portal-app:latest .
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
$KUBECTL apply -f k8s/deployment.yaml
$KUBECTL apply -f k8s/service.yaml

echo "🔄 Triggering pod rollout restart..."
$KUBECTL rollout restart deployment/nss-portal-app -n nss-portal

echo "⏳ Waiting for deployment rollout to complete..."
$KUBECTL rollout status deployment/nss-portal-app -n nss-portal --timeout=120s

echo "============================================================"
echo "✅ DVLA NSS Portal successfully deployed to Kubernetes!"
echo "============================================================"
echo "Access points:"
echo "  - LoadBalancer / Port: http://<YOUR_UBUNTU_SERVER_IP>:8080"
echo "  - Cluster IP Service: port 8080 inside namespace 'nss-portal'"
echo "============================================================"
