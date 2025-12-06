# 🚀 Getting Started with Fixed Docker Setup

## What Was Fixed

Your Docker container was failing with:
```
Error: Cannot find module 'nodemailer'
```

**Root cause:** Dependencies weren't being installed in the container.

**Solution:** Created a complete Docker setup that properly installs `npm` dependencies before starting the server.

---

## ⚡ Quick Start (5 minutes)

### Step 1: Verify Docker Installation
```powershell
# Run diagnostic check
.\test-docker-setup.ps1
```

You should see all green checkmarks. If not, install Docker Desktop from https://www.docker.com/products/docker-desktop

### Step 2: Build and Start Container
```powershell
# From the repository root
.\rebuild-docker.ps1
```

This will:
- Build a new Docker image with all dependencies installed
- Start the container
- Show you the live logs

### Step 3: Verify It's Working

In the logs, look for:
```
✅ Dependencies installed successfully
✅ nodemailer@6.9.7
✅ express@5.1.0
✅ mongoose@8.14.2
Server listening on port 5000
```

### Step 4: Test the API
```powershell
# Open PowerShell and test
curl http://localhost:5000
```

---

## 📁 Files Created/Updated

| File | Purpose |
|------|---------|
| `twm3-backend/Dockerfile` | Docker build instructions with dependency installation |
| `twm3-backend/entrypoint.sh` | Startup script that ensures dependencies are installed |
| `docker-compose.yml` | Container orchestration configuration |
| `rebuild-docker.ps1` | Script to rebuild everything from scratch |
| `install-deps-docker.ps1` | Script to install deps without rebuilding |
| `test-docker-setup.ps1` | Diagnostic script to verify setup |
| `.dockerignore` | Excludes unnecessary files from build |

---

## 🎯 Common Tasks

### Start the Container
```powershell
docker-compose up -d
```

### Stop the Container
```powershell
docker-compose stop
```

### View Logs
```powershell
# Real-time logs
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50

# Specific service
docker-compose logs backend
```

### Restart Container
```powershell
docker-compose restart
```

### Rebuild After Code Changes
```powershell
# If only JS files changed (quick restart)
docker-compose restart backend

# If package.json changed (rebuild)
.\rebuild-docker.ps1

# Complete clean rebuild
docker system prune -a
.\rebuild-docker.ps1
```

### Shell into Container
```powershell
docker exec -it twm3-backend sh

# Once inside
ls               # See files
npm list         # See installed packages
exit             # Exit shell
```

### Check Container Status
```powershell
docker ps
# or
docker-compose ps
```

---

## 🔍 Troubleshooting

### "Cannot find module" errors still occurring?

1. **Check if node_modules is installed:**
   ```powershell
   docker exec twm3-backend ls node_modules | head -10
   ```

2. **If empty, install manually:**
   ```powershell
   .\install-deps-docker.ps1
   ```

3. **If that doesn't work, rebuild:**
   ```powershell
   docker system prune -a
   .\rebuild-docker.ps1
   ```

### Container crashes immediately?

1. **View the error:**
   ```powershell
   docker-compose logs backend
   ```

2. **Check if port 5000 is in use:**
   ```powershell
   netstat -ano | findstr :5000
   ```
   If in use, either stop what's using it or edit `docker-compose.yml`:
   ```yaml
   ports:
     - "5001:5000"  # Use port 5001 instead
   ```

3. **Rebuild with fresh image:**
   ```powershell
   .\rebuild-docker.ps1
   ```

### Docker commands not found?

Make sure Docker Desktop is running. On Windows, look for the Docker icon in the system tray.

### Port 5000 not responding?

1. **Wait 10-15 seconds** - First startup takes time for database connection
2. **Check health:**
   ```powershell
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```
3. **Check logs:**
   ```powershell
   docker-compose logs backend
   ```

---

## 📊 Performance Tips

### First Build: 1-2 minutes
- Downloading base image (~50MB)
- Installing dependencies (~100MB)
- Normal for first run

### Subsequent Starts: <5 seconds
- Docker caches everything
- Just starting the container

### Faster Rebuilds
- **For code changes only:** Use `docker-compose restart backend`
- **For dependency updates:** Use `.\install-deps-docker.ps1`
- **For complete rebuild:** Use `.\rebuild-docker.ps1`

---

## 🔐 Environment Variables

The container automatically loads from `.env.production`. Make sure you have:

```bash
# Example .env.production
MONGODB_URI=your_mongodb_url
JWT_SECRET=your_secret_key
PORT=5000
NODE_ENV=production
```

---

## 📝 Development Workflow

### During Development

```powershell
# Start container
docker-compose up -d

# Watch logs
docker-compose logs -f

# Make code changes - they're reflected after restart
docker-compose restart backend

# Or just rebuild if you changed package.json
.\rebuild-docker.ps1
```

### Before Deployment

```powershell
# Final rebuild to ensure everything is clean
docker system prune -a
.\rebuild-docker.ps1

# Test thoroughly
docker-compose logs -f

# Verify all services
curl http://localhost:5000/health
```

---

## 🆘 Getting Help

### Check what's installed:
```powershell
docker exec twm3-backend npm list
```

### Verify specific module:
```powershell
docker exec twm3-backend npm list nodemailer
```

### See full startup logs:
```powershell
docker-compose logs --tail=100 backend
```

### Check container resources:
```powershell
docker stats twm3-backend
```

---

## ✅ Verification Checklist

After running `.\rebuild-docker.ps1`, verify:

- [ ] Container started successfully
- [ ] Logs show "Dependencies installed successfully"
- [ ] Logs show "nodemailer@6.9.7" or similar
- [ ] Logs show "Server listening on port 5000"
- [ ] Can curl http://localhost:5000
- [ ] No "Cannot find module" errors

---

## 🎓 Understanding the Setup

### The Dockerfile does this:
1. Starts with Node.js 22 Alpine image (lightweight)
2. Copies package.json and package-lock.json
3. **Runs `npm ci --omit=dev`** ← This installs dependencies!
4. Copies all code files
5. Runs entrypoint script on container start

### The Entrypoint Script:
1. Checks if node_modules exists
2. If not, runs `npm ci` to install
3. Verifies key packages are installed
4. Starts the server with `npm start`

This double-safety ensures dependencies are always available.

---

## 📞 Next Steps

1. ✅ Run `.\test-docker-setup.ps1` to verify everything
2. ✅ Run `.\rebuild-docker.ps1` to build and start
3. ✅ Verify logs show success
4. ✅ Test API endpoints
5. ✅ Commit changes to git
6. ✅ Update team on the fix

---

**Last Updated:** December 6, 2025
**Status:** Production Ready ✅
