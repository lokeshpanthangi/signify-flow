# EC2 Deployment Guide

## Quick Start

### 1. Initial Setup on EC2

SSH into your EC2 instance and clone the repository:

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
cd ~
git clone https://github.com/lokeshpanthangi/signify-flow.git
cd signify-flow
```

### 2. Run Deployment Script

Make the script executable and run it:

```bash
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

The script will:
- ✅ Prompt for your EC2 public IP
- ✅ Install Python 3.11+, Node.js 20+, and all dependencies
- ✅ Update `.env` files with correct IP addresses
- ✅ Start backend (port 8081) and frontend (port 8080)

### 3. Configure Security Group

**CRITICAL:** Your EC2 Security Group must allow inbound traffic:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | Frontend (Vite) |
| Custom TCP | TCP | 8081 | 0.0.0.0/0 | Backend (FastAPI) |
| SSH | TCP | 22 | Your IP | SSH access |

Go to: **EC2 Console → Security Groups → Select your SG → Edit inbound rules**

### 4. Access Your Application

Once deployed, access your app at:
- **Frontend:** http://YOUR_EC2_IP:8080
- **Backend API:** http://YOUR_EC2_IP:8081
- **API Docs:** http://YOUR_EC2_IP:8081/docs

---

## Managing Services

### Check Status

```bash
chmod +x check-status.sh
./check-status.sh
```

### Stop Services

```bash
chmod +x stop-services.sh
./stop-services.sh
```

### View Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Follow both logs
tail -f logs/*.log
```

### Restart Services

```bash
./stop-services.sh
./deploy-ec2.sh
```

---

## Troubleshooting

### Issue: Login not working after deployment

**Cause:** Frontend `.env` pointing to wrong backend URL

**Fix:**
```bash
# Check frontend .env
cat .env | grep VITE_API_URL

# Should be: VITE_API_URL=http://YOUR_EC2_IP:8081
# NOT port 8080!
```

Edit `.env` and change:
```bash
VITE_API_URL=http://YOUR_EC2_IP:8081
```

Then restart:
```bash
./stop-services.sh && ./deploy-ec2.sh
```

### Issue: Cannot access from browser

**Possible causes:**

1. **Security Group not configured**
   - Add inbound rules for ports 8080 and 8081

2. **Services not running**
   ```bash
   ./check-status.sh
   ```

3. **Firewall blocking ports**
   ```bash
   sudo ufw status
   # If active, allow ports:
   sudo ufw allow 8080
   sudo ufw allow 8081
   ```

### Issue: Port already in use

```bash
# Kill processes on ports 8080 and 8081
./stop-services.sh

# Or manually:
sudo kill -9 $(sudo lsof -t -i:8081)
sudo kill -9 $(sudo lsof -t -i:8080)
```

### Issue: Python/Node version too old

The deployment script automatically installs newer versions, but if it fails:

```bash
# Python 3.11
sudo apt-get install python3.11 python3.11-venv -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install nodejs -y
```

---

## Production Deployment (Persistent Services)

The basic deployment uses `nohup` which stops when you log out. For production, use **systemd** or **PM2**.

### Option 1: PM2 (Recommended for Node.js apps)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Stop nohup processes
./stop-services.sh

# Start backend with PM2
cd backend
pm2 start "python3 -m uvicorn main:app --host 0.0.0.0 --port 8081" --name signify-backend

# Start frontend with PM2
cd ..
pm2 start "npm run dev -- --host 0.0.0.0 --port 8080" --name signify-frontend

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Check status
pm2 status
pm2 logs
```

### Option 2: Systemd Services

Create service files in `/etc/systemd/system/`:

**Backend:** `/etc/systemd/system/signify-backend.service`
```ini
[Unit]
Description=SignifyFlow Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/signify-flow/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8081
Restart=always

[Install]
WantedBy=multi-user.target
```

**Frontend:** `/etc/systemd/system/signify-frontend.service`
```ini
[Unit]
Description=SignifyFlow Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/signify-flow
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0 --port 8080
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable signify-backend signify-frontend
sudo systemctl start signify-backend signify-frontend
sudo systemctl status signify-backend signify-frontend
```

---

## Environment Variables

After running the deployment script, verify your `.env` files:

### Backend `.env` (backend/.env)
```bash
BACKEND_URL=http://YOUR_EC2_IP:8081
FRONTEND_URL=http://YOUR_EC2_IP:8080
ALLOWED_ORIGINS=http://YOUR_EC2_IP:8080,http://YOUR_EC2_IP:8081
SUPABASE_URL=https://kdbxpoidpyqevmivzaih.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Frontend `.env` (root .env)
```bash
VITE_API_URL=http://YOUR_EC2_IP:8081  # Must be 8081 (backend port)!
VITE_SUPABASE_URL=https://kdbxpoidpyqevmivzaih.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Performance Tips

1. **Use production build for frontend:**
   ```bash
   npm run build
   npx vite preview --host 0.0.0.0 --port 8080
   ```

2. **Add gzip compression in Nginx reverse proxy**

3. **Use CDN for static assets**

4. **Enable Supabase connection pooling**

---

## Security Checklist

- ✅ Keep `.env` files in `.gitignore`
- ✅ Rotate Supabase keys after any public exposure
- ✅ Restrict Security Group to specific IPs (not 0.0.0.0/0) for production
- ✅ Use HTTPS in production (setup Let's Encrypt + Nginx)
- ✅ Enable rate limiting on auth endpoints
- ✅ Keep system packages updated: `sudo apt-get update && sudo apt-get upgrade`

---

## Support

If you encounter issues:

1. Check logs: `tail -f logs/*.log`
2. Verify services: `./check-status.sh`
3. Test API directly: `curl http://YOUR_EC2_IP:8081/`
4. Check Security Group inbound rules
5. Verify `.env` files have correct IP addresses
