#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# SignifyFlow - Stop Services Script
# ═══════════════════════════════════════════════════════════════════════════════
# Stops both frontend and backend servers

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping SignifyFlow services...${NC}"
echo ""

# Stop backend (port 8081)
if lsof -i:8081 > /dev/null 2>&1; then
    echo -e "${YELLOW}→${NC} Stopping backend (port 8081)..."
    sudo kill -9 $(sudo lsof -t -i:8081) 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Backend stopped"
else
    echo -e "${YELLOW}⚠${NC} Backend not running"
fi

# Stop frontend (port 8080)
if lsof -i:8080 > /dev/null 2>&1; then
    echo -e "${YELLOW}→${NC} Stopping frontend (port 8080)..."
    sudo kill -9 $(sudo lsof -t -i:8080) 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Frontend stopped"
else
    echo -e "${YELLOW}⚠${NC} Frontend not running"
fi

echo ""
echo -e "${GREEN}All services stopped${NC}"
