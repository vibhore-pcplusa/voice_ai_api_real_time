#!/bin/bash

# Docker deployment script for Voice AI System

set -e

echo "🚀 Starting Voice AI System deployment with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start the containers
echo "🔨 Building and starting containers..."
docker-compose up --build -d

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Check if containers are running
echo "🔍 Checking container status..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs --tail=20

echo "✅ Voice AI System is now running!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"

# Show how to stop the system
echo ""
echo "To stop the system, run:"
echo "docker-compose down"

# Show how to view logs
echo ""
echo "To view logs, run:"
echo "docker-compose logs -f"
