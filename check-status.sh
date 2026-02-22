#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# SignifyFlow - Status Check Script
# ═══════════════════════════════════════════════════════════════════════════════
# Checks if frontend and backend services are running

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        SignifyFlow Service Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Check backend
echo -n "Backend (port 8081):  "
if lsof -i:8081 > /dev/null 2>&1; then
    PID=$(lsof -t -i:8081)
    echo -e "${GREEN}✓ Running${NC} (PID: $PID)"
    
    # Test API endpoint
    if curl -s http://localhost:8081/ > /dev/null 2>&1; then
        echo -e "                      ${GREEN}✓ API responding${NC}"
    else
        echo -e "                      ${RED}✗ API not responding${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
fi

echo ""

# Check frontend
echo -n "Frontend (port 8080): "
if lsof -i:8080 > /dev/null 2>&1; then
    PID=$(lsof -t -i:8080)
    echo -e "${GREEN}✓ Running${NC} (PID: $PID)"
    
    # Test frontend endpoint
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
        echo -e "                      ${GREEN}✓ Server responding${NC}"
    else
        echo -e "                      ${RED}✗ Server not responding${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# Show recent log entries if services are running
if lsof -i:8081 > /dev/null 2>&1 || lsof -i:8080 > /dev/null 2>&1; then
    echo ""
    echo -e "${BLUE}Recent logs:${NC}"
    echo ""
    
    if [ -f "logs/backend.log" ]; then
        echo -e "Backend (last 3 lines):"
        tail -n 3 logs/backend.log | sed 's/^/  /'
        echo ""
    fi
    
    if [ -f "logs/frontend.log" ]; then
        echo -e "Frontend (last 3 lines):"
        tail -n 3 logs/frontend.log | sed 's/^/  /'
        echo ""
    fi
fi
