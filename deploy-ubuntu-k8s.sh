#!/bin/bash
# ==============================================================================
# DVLA NSS Portal - Ubuntu Kubernetes Deployment Helper Script
# ==============================================================================

set -e

echo "============================================================"
echo "🚀 Starting DVLA NSS Portal Kubernetes Deployment"
echo "============================================================"

# Build image
echo "🔨 Building Docker image..."
docker build -t nss-portal-app:latest .

# Determine Kubernetes CLI tool
if command -v k3s &> /dev/null || [ -f /usr/local/bin/k3s ]; then
    echo "📦 Detected K3s on Ubuntu server."
    echo "📥 Importing Docker image to K3s (k8s.io namespace)..."
    if sudo k3s image import --help &> /dev/null 2>&1; then
        docker save nss-portal-app:latest | sudo k3s image import -
    else
        docker save nss-portal-app:latest | sudo k3s ctr -n k8s.io images import -
    fi
    KUBECTL="sudo k3s kubectl"
elif command -v microk8s &> /dev/null; then
    echo "📦 Detected MicroK8s on Ubuntu server."
    echo "📥 Importing image to MicroK8s..."
    microk8s ctr image build -t nss-portal-app:latest .
    KUBECTL="microk8s kubectl"
elif command -v kubectl &> /dev/null; then
    echo "📦 Standard Docker & kubectl environment detected."
    KUBECTL="kubectl"
elif sudo kubectl version --client &> /dev/null 2>&1; then
    KUBECTL="sudo kubectl"
else
    KUBECTL="sudo k3s kubectl"
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
