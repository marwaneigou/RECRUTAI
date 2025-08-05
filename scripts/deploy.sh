#!/bin/bash

# RecrutIA Docker Deployment Script

set -e

echo "🚀 Starting RecrutIA deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration before running again."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting databases..."
docker-compose up -d postgres mongodb

echo "⏳ Waiting for databases to be ready..."
sleep 30

echo "🔄 Running database migrations..."
docker-compose run --rm backend npx prisma migrate deploy
docker-compose run --rm backend npx prisma db seed

echo "🚀 Starting all services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 60

# Health checks
echo "🏥 Performing health checks..."

services=("backend:3001" "frontend:3000" "analysis-service:5002" "matching-service:5001" "recommendation-service:5003")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name health check failed"
    fi
done

echo ""
echo "🎉 RecrutIA deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend:              http://localhost:3000"
echo "   Backend API:           http://localhost:3001"
echo "   Analysis Service:      http://localhost:5002"
echo "   Matching Service:      http://localhost:5001"
echo "   Recommendation Service: http://localhost:5003"
echo ""
echo "🗄️  Database URLs:"
echo "   PostgreSQL:            localhost:5432"
echo "   MongoDB:               localhost:27017"
echo ""
echo "📊 View logs with: docker-compose logs -f [service-name]"
echo "🛑 Stop services with: docker-compose down"
