#!/bin/bash
echo "🚀 Starting DevOps Deployment..."

# Set minikube docker environment
eval $(minikube docker-env)

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t devops:latest .

# Clean up old resources
echo "🧹 Cleaning up old resources..."
kubectl delete deployment devops-deployment --ignore-not-found
kubectl delete service devops-service --ignore-not-found
kubectl delete ingress devops-ingress --ignore-not-found

# Apply configurations
echo "📦 Applying configurations..."
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Wait for deployment
echo "⏳ Waiting for deployment to be ready..."
sleep 15

# Check status
echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📊 Status:"
kubectl get deployment devops-deployment
echo ""
kubectl get pods -l app=devops
echo ""
kubectl get service devops-service
echo ""
kubectl get ingress

# Get access information
MINIKUBE_IP=$(minikube ip)
echo ""
echo "🔗 Access Information:"
echo "1. Direct NodePort access: http://$MINIKUBE_IP:30009"
echo "2. Ingress URL: http://www.duhigure.com"
echo ""
echo "📝 For local testing, add to /etc/hosts:"
echo "sudo bash -c 'echo \"$MINIKUBE_IP www.duhigure.com\" >> /etc/hosts'"
echo ""
echo "🔄 To test: curl -H 'Host: www.duhigure.com' http://$MINIKUBE_IP"




# create new folder name it system and include the pages once i click on system login button which is located in public-section pages let me leave public section and go to system question