#!/bin/bash

# RecrutIA Development Setup Script

set -e

echo "🛠️  Setting up RecrutIA for development..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration."
fi

# Start databases only
echo "🗄️  Starting databases..."
docker-compose up -d postgres mongodb

echo "⏳ Waiting for databases to be ready..."
sleep 30

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend/smart-recruit-app && npm install && cd ../..

echo "📦 Installing Python service dependencies..."
cd services/analysis-service && pip install -r requirements.txt && cd ../..
cd services/matching-service && pip install -r requirements.txt && cd ../..
cd services/recommendation-service && pip install -r requirements.txt && cd ../..

# Database setup
echo "🔄 Setting up database..."
cd backend
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ..

echo ""
echo "🎉 Development setup completed!"
echo ""
echo "🚀 To start development servers:"
echo "   Backend:               cd backend && npm run dev"
echo "   Frontend:              cd frontend/smart-recruit-app && npm start"
echo "   Analysis Service:      cd services/analysis-service && python app.py"
echo "   Matching Service:      cd services/matching-service && python app.py"
echo "   Recommendation Service: cd services/recommendation-service && python app.py"
echo ""
echo "🐳 Or use Docker for development:"
echo "   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up"
