#!/bin/bash
# ==============================================================================
# HR Validation System - Ubuntu Kubernetes Deployment Helper Script
# ==============================================================================

set -e

echo "============================================================"
echo "🚀 Starting HR Validation System Kubernetes Deployment"
echo "============================================================"

# Check if Docker or MicroK8s container tool is available
if command -v microk8s &> /dev/null; then
    echo "📦 Detected MicroK8s on Ubuntu server."
    echo "🔨 Building Docker container image directly into MicroK8s..."
    microk8s ctr image build -t hr-validation-app:latest .
    KUBECTL="microk8s kubectl"
elif command -v k3s &> /dev/null; then
    echo "📦 Detected K3s on Ubuntu server."
    echo "🔨 Building Docker image and importing to K3s (k8s.io namespace)..."
    docker build -t hr-validation-app:latest .
    if sudo k3s image import --help &> /dev/null; then
        docker save hr-validation-app:latest | sudo k3s image import -
    else
        docker save hr-validation-app:latest | sudo k3s ctr -n k8s.io images import -
    fi
    KUBECTL="k3s kubectl"
else
    echo "📦 Standard Docker & kubectl environment detected."
    echo "🔨 Building Docker image..."
    docker build -t hr-validation-app:latest .
    KUBECTL="kubectl"
fi

echo "📄 Applying Kubernetes manifests..."
$KUBECTL apply -f k8s/namespace.yaml
$KUBECTL apply -f k8s/configmap.yaml
$KUBECTL apply -f k8s/secret.yaml
$KUBECTL apply -f k8s/pv-pvc.yaml
$KUBECTL apply -f k8s/deployment.yaml
$KUBECTL apply -f k8s/service.yaml
$KUBECTL apply -f k8s/ingress.yaml

echo "🔄 Triggering pod rollout restart..."
$KUBECTL rollout restart deployment/hr-validation-app -n hr-validation

echo "⏳ Waiting for deployment rollout to complete..."
$KUBECTL rollout status deployment/hr-validation-app -n hr-validation --timeout=120s

echo "============================================================"
echo "✅ HR Validation System successfully deployed to Kubernetes!"
echo "============================================================"
echo "Access points:"
echo "  - NodePort: http://<YOUR_UBUNTU_SERVER_IP>:30080"
echo "  - Cluster IP Service: port 80 inside namespace 'hr-validation'"
echo "============================================================"
