#!/usr/bin/env bash

# ═══════════════════════════════════════════════════════════════════════════════
# SignifyFlow — EC2 A-to-Z Deployment Script
# ═══════════════════════════════════════════════════════════════════════════════
#
# One script to rule them all.
# User clones the repo, runs this, and EVERYTHING is done:
#
#   1.  Asks for EC2 public IP
#   2.  Installs system packages (Python 3, Node 20, git, lsof)
#   3.  Installs python3-venv, creates a Python virtual environment
#   4.  Installs Python packages inside the venv
#   5.  Creates BOTH .env files from scratch (frontend + backend) with correct IP
#   6.  Installs Node.js / npm packages
#   7.  Kills anything already on ports 8080 & 8081
#   8.  Starts backend  via nohup (uvicorn, --host 0.0.0.0 --port 8081)
#   9.  Starts frontend via nohup (vite,    --host 0.0.0.0 --port 8080)
#   10. Prints URLs, PIDs, and next steps
#
# Usage:
#   chmod +x deploy-ec2.sh && ./deploy-ec2.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ${NC}  $1"; }
ok()      { echo -e "${GREEN}✓${NC}  $1"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $1"; }
fail()    { echo -e "${RED}✗${NC}  $1"; }
step()    { echo ""; echo -e "${CYAN}━━━ $1 ━━━${NC}"; }
has()     { command -v "$1" >/dev/null 2>&1; }

# ─── Project Root ─────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
PROJECT_DIR="$SCRIPT_DIR"

# ─── Banner ───────────────────────────────────────────────────────────────────
clear
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║         SignifyFlow  —  EC2 A-to-Z Deployment                   ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — Ask for EC2 IP
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 1/10 — EC2 Public IP"

echo ""
info "Enter your EC2 Public IP (e.g. 13.233.57.169):"
read -rp "  → IP: " EC2_IP

if [[ ! "$EC2_IP" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    fail "Invalid IP format. Run the script again."
    exit 1
fi
ok "Using IP: $EC2_IP"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — Detect OS & update packages
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 2/10 — System Update"

if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    OS="$ID"
    ok "OS: $PRETTY_NAME"
else
    fail "Cannot detect OS. Supports Ubuntu/Debian/Amazon Linux."
    exit 1
fi

if [[ "$OS" == "ubuntu" || "$OS" == "debian" ]]; then
    PM="apt-get"
    sudo apt-get update -qq > /dev/null 2>&1 && ok "apt updated" || warn "apt update failed (continuing)"
elif [[ "$OS" == "amzn" || "$OS" == "rhel" || "$OS" == "centos" ]]; then
    PM="yum"
    sudo yum update -y -q > /dev/null 2>&1 && ok "yum updated" || warn "yum update failed (continuing)"
else
    fail "Unsupported OS: $OS"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — Install Python 3, pip, venv, lsof, curl, git
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 3/10 — Install System Packages"

if [[ "$PM" == "apt-get" ]]; then
    sudo apt-get install -y -qq python3 python3-pip python3-venv git curl lsof > /dev/null 2>&1
else
    sudo yum install -y -q python3 python3-pip git curl lsof > /dev/null 2>&1
fi

# Verify python3
if has python3; then
    ok "Python $(python3 --version 2>&1 | cut -d' ' -f2)"
else
    fail "python3 not found after install. Aborting."
    exit 1
fi

ok "pip $(pip3 --version 2>&1 | awk '{print $2}')"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — Install Node.js 20 LTS (if missing or too old)
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 4/10 — Install Node.js 20"

NEED_NODE=false
if has node; then
    NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
    if [[ "$NODE_MAJOR" -ge 18 ]]; then
        ok "Node $(node -v) already installed"
    else
        warn "Node $(node -v) is too old (need 18+)"
        NEED_NODE=true
    fi
else
    NEED_NODE=true
fi

if [[ "$NEED_NODE" == "true" ]]; then
    info "Installing Node.js 20 LTS..."
    if [[ "$PM" == "apt-get" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - > /dev/null 2>&1
        sudo apt-get install -y -qq nodejs > /dev/null 2>&1
    else
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash - > /dev/null 2>&1
        sudo yum install -y -q nodejs > /dev/null 2>&1
    fi
    ok "Node $(node -v) installed"
fi

ok "npm v$(npm -v)"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — Create Python venv & install dependencies
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 5/10 — Python Virtual Environment"

VENV_DIR="$PROJECT_DIR/backend/venv"

if [ -d "$VENV_DIR" ]; then
    warn "Existing venv found — removing to rebuild clean"
    rm -rf "$VENV_DIR"
fi

info "Creating venv at backend/venv ..."
python3 -m venv "$VENV_DIR"
ok "venv created"

# Activate venv
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
ok "venv activated ($(python --version))"

info "Upgrading pip..."
pip install --upgrade pip --quiet > /dev/null 2>&1
ok "pip $(pip --version | awk '{print $2}')"

info "Installing Python packages from requirements.txt..."
pip install -r "$PROJECT_DIR/backend/requirements.txt" --quiet > /dev/null 2>&1
ok "All Python packages installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — Create Backend .env from scratch
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 6/10 — Create backend/.env"

cat > "$PROJECT_DIR/backend/.env" << BACKEND_ENV
# ══════════════════════════════════════════════════════════════════════════════
# SignifyFlow – Backend Environment Variables
# ══════════════════════════════════════════════════════════════════════════════

# ── App ───────────────────────────────────────────────────────────────────────
APP_NAME=SignifyFlow
APP_VERSION=1.0.0
DEBUG=false

# ── Server ────────────────────────────────────────────────────────────────────
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8081
BACKEND_URL=http://${EC2_IP}:8081

# ── Frontend / CORS ──────────────────────────────────────────────────────────
FRONTEND_URL=http://${EC2_IP}:8080
ALLOWED_ORIGINS=http://${EC2_IP}:8080,http://${EC2_IP}:8081,http://localhost:8080,http://localhost:8081

# ── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL=https://kdbxpoidpyqevmivzaih.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYnhwb2lkcHlxZXZtaXZ6YWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE0NjIsImV4cCI6MjA4NjMyNzQ2Mn0.lbq9_gVDm0SAdY7-zUkxj15kS2AFfL9RQeAH_Ah4qPc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYnhwb2lkcHlxZXZtaXZ6YWloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc1MTQ2MiwiZXhwIjoyMDg2MzI3NDYyfQ.C7hbeEipZFe42hSbAje9-hhpC2OE-8LpdoZahfC9rXk

# ── JWT / Auth ────────────────────────────────────────────────────────────────
JWT_SECRET=QcoFJkoqmpah65g6sBJUb0f8LKtpkfp7JNCmBdPXlgPg0AarAHVEnyYqqwo8ZA+XbWDhrfSHvyZoS3vhsXUdcg==
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ── File Upload ───────────────────────────────────────────────────────────────
MAX_UPLOAD_SIZE_MB=25
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,png,jpg,jpeg
BACKEND_ENV

ok "backend/.env created with IP = \$EC2_IP"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — Create Frontend .env from scratch
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 7/10 — Create frontend .env"

cat > "$PROJECT_DIR/.env" << FRONTEND_ENV
# ═══════════════════════════════════════════════════════════════════════════════
# SignifyFlow – Frontend Environment Variables
# ═══════════════════════════════════════════════════════════════════════════════

# ── Backend API (MUST be port 8081 — the backend port, NOT 8080) ──────────────
VITE_API_URL=http://${EC2_IP}:8081

# ── Supabase ──────────────────────────────────────────────────────────────────
VITE_SUPABASE_URL=https://kdbxpoidpyqevmivzaih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkYnhwb2lkcHlxZXZtaXZ6YWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTE0NjIsImV4cCI6MjA4NjMyNzQ2Mn0.lbq9_gVDm0SAdY7-zUkxj15kS2AFfL9RQeAH_Ah4qPc

# ── App Meta ──────────────────────────────────────────────────────────────────
VITE_APP_NAME=SignifyFlow

# ── Feature Flags ─────────────────────────────────────────────────────────────
VITE_ENABLE_AI_FIELD_DETECTION=true

# ── File Upload ───────────────────────────────────────────────────────────────
VITE_MAX_UPLOAD_SIZE_MB=25
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,txt,png,jpg,jpeg
FRONTEND_ENV

ok "frontend .env created with VITE_API_URL = http://\${EC2_IP}:8081"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 — Install Node.js packages
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 8/10 — Install Node.js Packages"

info "Running npm install (may take 2-3 minutes on first run)..."
cd "$PROJECT_DIR"
npm install > /dev/null 2>&1 || npm install
ok "All Node.js packages installed"

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 9 — Kill existing processes & start services
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 9/10 — Start Services (nohup)"

# Create logs dir
mkdir -p "$PROJECT_DIR/logs"

# Kill anything on 8081
if lsof -i:8081 > /dev/null 2>&1; then
    warn "Port 8081 in use — killing..."
    sudo kill -9 $(sudo lsof -t -i:8081) 2>/dev/null || true
    sleep 2
fi

# Kill anything on 8080
if lsof -i:8080 > /dev/null 2>&1; then
    warn "Port 8080 in use — killing..."
    sudo kill -9 $(sudo lsof -t -i:8080) 2>/dev/null || true
    sleep 2
fi

ok "Ports 8080 & 8081 cleared"

# ── Start Backend ─────────────────────────────────────────────────────────────
info "Starting backend (uvicorn) on 0.0.0.0:8081 ..."

cd "$PROJECT_DIR/backend"

# Run uvicorn using the venv python — nohup + background
nohup "$VENV_DIR/bin/python" -m uvicorn main:app \
    --host 0.0.0.0 \
    --port 8081 \
    --reload \
    > "$PROJECT_DIR/logs/backend.log" 2>&1 &

BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    ok "Backend running (PID $BACKEND_PID)"
else
    fail "Backend failed to start.  Check: tail -f logs/backend.log"
    tail -5 "$PROJECT_DIR/logs/backend.log" 2>/dev/null || true
    exit 1
fi

# ── Start Frontend ────────────────────────────────────────────────────────────
info "Starting frontend (vite) on 0.0.0.0:8080 ..."

cd "$PROJECT_DIR"

nohup npm run dev -- --host 0.0.0.0 --port 8080 \
    > "$PROJECT_DIR/logs/frontend.log" 2>&1 &

FRONTEND_PID=$!
sleep 5

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    ok "Frontend running (PID $FRONTEND_PID)"
else
    fail "Frontend failed to start.  Check: tail -f logs/frontend.log"
    tail -5 "$PROJECT_DIR/logs/frontend.log" 2>/dev/null || true
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 10 — Done!
# ═══════════════════════════════════════════════════════════════════════════════
step "STEP 10/10 — All Done!"

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║               DEPLOYMENT SUCCESSFUL                             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Frontend :${NC}  http://${EC2_IP}:8080"
echo -e "  ${CYAN}Backend  :${NC}  http://${EC2_IP}:8081"
echo -e "  ${CYAN}API Docs :${NC}  http://${EC2_IP}:8081/docs"
echo ""
echo -e "  ${CYAN}Backend PID :${NC}  $BACKEND_PID"
echo -e "  ${CYAN}Frontend PID:${NC}  $FRONTEND_PID"
echo ""
echo -e "  ${BLUE}View logs:${NC}"
echo "    tail -f logs/backend.log"
echo "    tail -f logs/frontend.log"
echo ""
echo -e "  ${BLUE}Stop both:${NC}"
echo "    kill $BACKEND_PID $FRONTEND_PID"
echo "    # or:  ./stop-services.sh"
echo ""
echo -e "  ${YELLOW}SECURITY GROUP — make sure these inbound rules exist:${NC}"
echo "    TCP 8080  from 0.0.0.0/0  (Frontend)"
echo "    TCP 8081  from 0.0.0.0/0  (Backend)"
echo "    TCP 22    from your IP    (SSH)"
echo ""
echo -e "  ${BLUE}(Optional) Persist across reboots:${NC}"
echo "    sudo npm i -g pm2"
echo "    pm2 start \"backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8081\" --name backend"
echo "    pm2 start \"npm run dev -- --host 0.0.0.0 --port 8080\" --name frontend"
echo "    pm2 save && pm2 startup"
echo ""
