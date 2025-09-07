#!/bin/bash

# Playground Deployment Script
# Usage: ./deploy.sh [dev|prod|update]

set -e

MODE=${1:-prod}
PROJECT_NAME="playground"

echo "======================================"
echo "Playground Deployment - $MODE"
echo "======================================"

if [ "$MODE" = "dev" ]; then
    echo "Starting development environment..."
    docker compose -p $PROJECT_NAME --profile dev up -d dev
    echo ""
    echo "✅ Development server running at http://localhost:5173"
    echo "   Hot reload enabled - changes will auto-refresh"
    
elif [ "$MODE" = "prod" ]; then
    echo "Building production image..."
    docker compose -p $PROJECT_NAME build
    
    echo "Starting production container..."
    docker compose -p $PROJECT_NAME up -d playground
    
    echo ""
    echo "✅ Production server running"
    echo "   Container: http://127.0.0.1:3080 (reverse proxy only)"
    echo "   Public: https://playground.gogentic.ai"
    
elif [ "$MODE" = "update" ]; then
    echo "Updating production deployment..."
    echo "1. Pulling latest changes..."
    git pull origin main
    
    echo "2. Stopping current container..."
    docker compose -p $PROJECT_NAME down
    
    echo "3. Building new image..."
    docker compose -p $PROJECT_NAME build
    
    echo "4. Starting updated container..."
    docker compose -p $PROJECT_NAME up -d playground
    
    echo ""
    echo "✅ Production updated and running"
    echo "   Public: https://playground.gogentic.ai"
    
else
    echo "Invalid mode. Use 'dev', 'prod', or 'update'"
    exit 1
fi

echo ""
echo "Useful commands:"
echo "  docker compose -p $PROJECT_NAME ps        # Check status"
echo "  docker compose -p $PROJECT_NAME logs -f   # View logs"
echo "  docker compose -p $PROJECT_NAME down      # Stop containers"
echo "  docker compose -p $PROJECT_NAME restart   # Restart containers"
echo ""
echo "For production updates:"
echo "  ./deploy.sh update                        # Pull, rebuild, and restart"