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

# Detect available Kubernetes CLI tool
KUBECTL=""

if [ -x /usr/local/bin/k3s ] || command -v k3s &> /dev/null; then
    K3S_BIN=$(command -v k3s || echo "/usr/local/bin/k3s")
    echo "📦 Detected K3s ($K3S_BIN)."
    echo "📥 Importing Docker image into K3s (k8s.io containerd namespace)..."
    if sudo $K3S_BIN image import --help &> /dev/null 2>&1; then
        docker save nss-portal-app:latest | sudo $K3S_BIN image import -
    else
        docker save nss-portal-app:latest | sudo $K3S_BIN ctr -n k8s.io images import -
    fi
    KUBECTL="sudo $K3S_BIN kubectl"
elif command -v microk8s &> /dev/null; then
    echo "📦 Detected MicroK8s."
    microk8s ctr image build -t nss-portal-app:latest .
    KUBECTL="microk8s kubectl"
elif command -v kubectl &> /dev/null; then
    echo "📦 Standard kubectl detected."
    KUBECTL="kubectl"
elif [ -x /usr/local/bin/kubectl ]; then
    KUBECTL="/usr/local/bin/kubectl"
elif [ -x /usr/bin/kubectl ]; then
    KUBECTL="/usr/bin/kubectl"
else
    echo "⚠️ Kubernetes CLI not found in PATH. Defaulting to 'sudo k3s kubectl'."
    KUBECTL="sudo /usr/local/bin/k3s kubectl"
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
