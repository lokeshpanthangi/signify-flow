#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════════
# SignifyFlow EC2 Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════
# This script automates the complete setup of SignifyFlow on an AWS EC2 instance.
#
# What it does:
# 1. Prompts for your EC2 public IP address
# 2. Installs all system dependencies (Python 3.11+, Node.js 20+, npm)
# 3. Installs Python packages (FastAPI, Supabase, etc.)
# 4. Installs frontend packages (React, Vite, etc.)
# 5. Updates .env files with correct IP addresses
# 6. Starts backend (port 8081) and frontend (port 8080)
#
# Usage:
#   chmod +x deploy-ec2.sh
#   ./deploy-ec2.sh
#
# After running, access your app at: http://YOUR_EC2_IP:8080
# ═══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Color codes for pretty output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Helper Functions ─────────────────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}✗${NC}  $1"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ─── Welcome Banner ───────────────────────────────────────────────────────────

clear
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ███████╗██╗ ██████╗ ███╗   ██╗██╗███████╗██╗   ██╗███████╗██╗          ║
║   ██╔════╝██║██╔════╝ ████╗  ██║██║██╔════╝╚██╗ ██╔╝██╔════╝██║          ║
║   ███████╗██║██║  ███╗██╔██╗ ██║██║█████╗   ╚████╔╝ █████╗  ██║          ║
║   ╚════██║██║██║   ██║██║╚██╗██║██║██╔══╝    ╚██╔╝  ██╔══╝  ██║          ║
║   ███████║██║╚██████╔╝██║ ╚████║██║██║        ██║   ██║     ███████╗     ║
║   ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝        ╚═╝   ╚═╝     ╚══════╝     ║
║                                                                           ║
║                        EC2 Deployment Script                              ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ─── Prompt for EC2 IP ────────────────────────────────────────────────────────

echo ""
log_info "Enter your EC2 Public IP address (e.g., 13.233.57.169):"
read -p "EC2 IP: " EC2_IP

# Validate IP format
if [[ ! $EC2_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    log_error "Invalid IP address format. Please run the script again."
    exit 1
fi

log_success "Using EC2 IP: $EC2_IP"
echo ""

# ─── Detect OS & Package Manager ──────────────────────────────────────────────

log_info "Detecting operating system..."

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    log_success "Detected OS: $PRETTY_NAME"
else
    log_error "Cannot detect OS. This script supports Ubuntu/Debian and Amazon Linux."
    exit 1
fi

# Set package manager based on OS
if [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    PKG_MANAGER="apt-get"
    PKG_UPDATE="sudo apt-get update -qq"
    PKG_INSTALL="sudo apt-get install -y -qq"
elif [[ "$OS" == "amzn" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "centos" ]]; then
    PKG_MANAGER="yum"
    PKG_UPDATE="sudo yum update -y -q"
    PKG_INSTALL="sudo yum install -y -q"
else
    log_error "Unsupported OS: $OS"
    exit 1
fi

echo ""

# ─── Update System Packages ───────────────────────────────────────────────────

log_info "Updating system packages..."
if $PKG_UPDATE > /dev/null 2>&1; then
    log_success "System packages updated"
else
    log_warning "Failed to update packages (continuing anyway)"
fi

echo ""

# ─── Install Python 3.9+ ──────────────────────────────────────────────────────

log_info "Checking Python installation..."

if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
    PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1)
    PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f2)
    log_success "Python $PYTHON_VERSION found"
    
    # Check if version is >= 3.9 using simple integer comparison
    if [[ "$PYTHON_MAJOR" -ge 3 ]] && [[ "$PYTHON_MINOR" -ge 9 ]]; then
        log_success "Python version is compatible"
    else
        log_warning "Python version too old (need 3.9+), installing newer version..."
        if [[ "$PKG_MANAGER" == "apt-get" ]]; then
            sudo add-apt-repository -y ppa:deadsnakes/ppa > /dev/null 2>&1 || true
            $PKG_UPDATE > /dev/null 2>&1 || true
            $PKG_INSTALL python3.11 python3.11-venv python3-pip 2>/dev/null || \
            $PKG_INSTALL python3 python3-venv python3-pip
        else
            $PKG_INSTALL python3 python3-pip
        fi
    fi
else
    log_warning "Python not found, installing..."
    if [[ "$PKG_MANAGER" == "apt-get" ]]; then
        $PKG_INSTALL python3 python3-venv python3-pip
    else
        $PKG_INSTALL python3 python3-pip
    fi
    log_success "Python installed"
fi

# Install pip if missing
if ! command_exists pip3; then
    log_warning "pip not found, installing..."
    $PKG_INSTALL python3-pip
fi

log_success "Python environment ready"
echo ""

# ─── Install Node.js 20+ ──────────────────────────────────────────────────────

log_info "Checking Node.js installation..."

if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    log_success "Node.js v$(node --version) found"
    
    if [[ $NODE_VERSION -ge 18 ]]; then
        log_success "Node.js version is compatible"
    else
        log_warning "Node.js version too old (need 18+), upgrading..."
        INSTALL_NODE=true
    fi
else
    log_warning "Node.js not found, installing..."
    INSTALL_NODE=true
fi

if [[ "$INSTALL_NODE" == "true" ]]; then
    log_info "Installing Node.js 20 LTS via NodeSource..."
    
    # Install Node.js 20 LTS using NodeSource
    if [[ "$PKG_MANAGER" == "apt-get" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
        $PKG_INSTALL nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
        $PKG_INSTALL nodejs
    fi
    
    log_success "Node.js $(node --version) installed"
fi

# Verify npm
if ! command_exists npm; then
    log_error "npm not found after Node.js installation"
    exit 1
fi

log_success "npm v$(npm --version) ready"
echo ""

# ─── Install Git (if missing) ─────────────────────────────────────────────────

if ! command_exists git; then
    log_info "Installing git..."
    $PKG_INSTALL git
    log_success "Git installed"
fi

echo ""

# ─── Navigate to Project Directory ───────────────────────────────────────────

PROJECT_DIR="/home/$(whoami)/signify-flow"

if [ ! -d "$PROJECT_DIR" ]; then
    log_warning "Project directory not found at $PROJECT_DIR"
    log_info "Using current directory: $(pwd)"
    PROJECT_DIR=$(pwd)
fi

cd "$PROJECT_DIR" || {
    log_error "Cannot navigate to project directory"
    exit 1
}

log_success "Working directory: $PROJECT_DIR"
echo ""

# ─── Update .env Files with EC2 IP ────────────────────────────────────────────

log_info "Updating environment files with EC2 IP: $EC2_IP"

# Backend .env
if [ -f "backend/.env" ]; then
    log_info "Updating backend/.env..."
    
    # Update BACKEND_URL
    sed -i.bak "s|^BACKEND_URL=.*|BACKEND_URL=http://${EC2_IP}:8081|" backend/.env
    
    # Update FRONTEND_URL
    sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=http://${EC2_IP}:8080|" backend/.env
    
    # Update ALLOWED_ORIGINS
    sed -i.bak "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=http://${EC2_IP}:8080,http://${EC2_IP}:8081,http://${EC2_IP}:5173,http://${EC2_IP}:3000|" backend/.env
    
    log_success "backend/.env updated"
else
    log_error "backend/.env not found! Please create it first."
    exit 1
fi

# Frontend .env
if [ -f ".env" ]; then
    log_info "Updating frontend .env..."
    
    # Update VITE_API_URL
    sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=http://${EC2_IP}:8081|" .env
    
    log_success "frontend .env updated"
else
    log_error "Frontend .env not found! Please create it first."
    exit 1
fi

echo ""

# ─── Install Python Dependencies ──────────────────────────────────────────────

log_info "Installing Python dependencies..."

cd backend

if [ -f "requirements.txt" ]; then
    pip3 install --quiet --upgrade pip
    pip3 install --quiet -r requirements.txt
    log_success "Python packages installed"
else
    log_error "backend/requirements.txt not found!"
    exit 1
fi

cd ..
echo ""

# ─── Install Node.js Dependencies ─────────────────────────────────────────────

log_info "Installing Node.js dependencies (this may take a few minutes)..."

if [ -f "package.json" ]; then
    npm install --silent > /dev/null 2>&1 || npm install
    log_success "Node.js packages installed"
else
    log_error "package.json not found!"
    exit 1
fi

echo ""

# ─── Kill Existing Processes ──────────────────────────────────────────────────

log_info "Checking for existing processes..."

# Kill existing backend process
if lsof -i:8081 > /dev/null 2>&1; then
    log_warning "Port 8081 in use, killing existing process..."
    sudo kill -9 $(sudo lsof -t -i:8081) 2>/dev/null || true
    sleep 2
fi

# Kill existing frontend process
if lsof -i:8080 > /dev/null 2>&1; then
    log_warning "Port 8080 in use, killing existing process..."
    sudo kill -9 $(sudo lsof -t -i:8080) 2>/dev/null || true
    sleep 2
fi

log_success "Ports cleared"
echo ""

# ─── Start Backend ────────────────────────────────────────────────────────────

log_info "Starting backend server on port 8081..."

cd backend

# Start backend in background with nohup
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8081 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a bit and check if it started
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    log_success "Backend started (PID: $BACKEND_PID)"
    echo -e "         Logs: ${BLUE}tail -f logs/backend.log${NC}"
else
    log_error "Backend failed to start. Check logs/backend.log"
    exit 1
fi

cd ..
echo ""

# ─── Start Frontend ───────────────────────────────────────────────────────────

log_info "Starting frontend server on port 8080..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Start frontend in background with nohup
nohup npm run dev -- --host 0.0.0.0 --port 8080 > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a bit and check if it started
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    log_success "Frontend started (PID: $FRONTEND_PID)"
    echo -e "         Logs: ${BLUE}tail -f logs/frontend.log${NC}"
else
    log_error "Frontend failed to start. Check logs/frontend.log"
    exit 1
fi

echo ""

# ─── Success Message ──────────────────────────────────────────────────────────

echo -e "${GREEN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                         🎉 DEPLOYMENT SUCCESSFUL! 🎉                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
log_success "SignifyFlow is now running!"
echo ""
echo -e "  ${BLUE}Frontend:${NC} http://${EC2_IP}:8080"
echo -e "  ${BLUE}Backend:${NC}  http://${EC2_IP}:8081"
echo -e "  ${BLUE}API Docs:${NC} http://${EC2_IP}:8081/docs"
echo ""
log_info "Process IDs:"
echo "  Backend:  $BACKEND_PID"
echo "  Frontend: $FRONTEND_PID"
echo ""
log_info "To view logs:"
echo -e "  ${BLUE}tail -f logs/backend.log${NC}"
echo -e "  ${BLUE}tail -f logs/frontend.log${NC}"
echo ""
log_info "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
log_warning "IMPORTANT: Make sure your EC2 Security Group allows inbound traffic on:"
echo "  - Port 8080 (Frontend)"
echo "  - Port 8081 (Backend API)"
echo ""
log_info "To make services persistent across reboots, consider using systemd or PM2"
echo ""
