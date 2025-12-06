# Docker Fix Summary - December 6, 2025

## Issue
The Docker container was continuously restarting with the error:
```
Error: Cannot find module 'nodemailer'
Require stack:
- /app/routes/messageRoutes.js
- /app/server.js
```

## Root Cause
The `npm install` command was never being executed in the Docker container, so `node_modules` directory was empty despite being listed in `package.json`.

## Solution Implemented

### 1. **Dockerfile** (`twm3-backend/Dockerfile`)
- Uses Node.js 22 Alpine (lightweight base image)
- Installs dependencies BEFORE copying application code
- Includes verification step to list installed packages
- Sets up health check
- Uses entrypoint script for robust startup

### 2. **Entrypoint Script** (`twm3-backend/entrypoint.sh`)
- Checks if node_modules already exists
- Installs dependencies only if needed
- Verifies key dependencies are installed
- Gracefully starts the server

### 3. **Docker Compose** (`docker-compose.yml`)
- Orchestrates container lifecycle
- Maps port 5000
- Sets production environment
- Uses environment file for configuration
- Auto-restarts on failure
- Mounts uploads volume for persistence

### 4. **Helper Scripts**

#### `rebuild-docker.ps1` - Complete Rebuild
Use this to rebuild everything from scratch:
```powershell
.\rebuild-docker.ps1
```
- Stops old container
- Removes old image
- Builds fresh image with no cache
- Starts new container
- Shows logs

#### `install-deps-docker.ps1` - Quick Fix
Use this to install dependencies without full rebuild:
```powershell
.\install-deps-docker.ps1
```
- Installs deps in running container
- Restarts container
- Shows logs

### 5. **Docker Ignore Files**
- `twm3-backend/.dockerignore` - Excludes unnecessary files from backend build
- `.dockerignore` - Excludes unnecessary files from root context

## How to Use

### First Time Setup
```powershell
cd d:\twm3-repo
.\rebuild-docker.ps1
```

Wait for output like:
```
✅ Dependencies installed successfully
nodemailer@6.9.7
express@5.1.0
mongoose@8.14.2
Server listening on port 5000
```

### Daily Usage
```powershell
# Start container
docker-compose up -d

# Stop container
docker-compose stop

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

## Verification Steps

1. **Check container is running:**
   ```powershell
   docker ps | findstr twm3-backend
   ```

2. **Check dependencies are installed:**
   ```powershell
   docker exec twm3-backend npm list nodemailer
   ```

3. **Test the API:**
   ```powershell
   curl http://localhost:5000/health
   ```

4. **View detailed logs:**
   ```powershell
   docker-compose logs backend
   ```

## Key Changes from Original

| Aspect | Before | After |
|--------|--------|-------|
| **Dependency Installation** | Never ran `npm install` in container | Runs automatically in Dockerfile and entrypoint |
| **Startup Script** | Direct `npm start` | Entrypoint script with verification |
| **Error Handling** | No retry mechanism | Restarts on failure |
| **Health Checks** | None | Every 30 seconds |
| **Build Optimization** | No .dockerignore | Optimized with .dockerignore files |
| **Debugging** | Difficult to diagnose | Clear logging of what's happening |

## Troubleshooting

### Container keeps restarting?
```powershell
# Check logs
docker-compose logs -f backend

# Check if port 5000 is available
netstat -ano | findstr :5000

# Rebuild from scratch
docker system prune -a
.\rebuild-docker.ps1
```

### Still getting MODULE_NOT_FOUND?
```powershell
# Check if dependencies are actually installed
docker exec twm3-backend ls node_modules | head -20

# Force reinstall
docker exec twm3-backend npm ci --omit=dev

# Restart
docker-compose restart backend
```

### Want to see what's in the container?
```powershell
# Shell into the container
docker exec -it twm3-backend sh

# List files
ls -la
ls -la node_modules | head -20

# Check package.json
cat package.json | grep -A 30 dependencies

# Exit
exit
```

## Performance Tips

1. **First build will take 1-2 minutes** - Downloading Node.js base image and installing 15+ dependencies
2. **Subsequent runs are fast** - Docker caches layers
3. **Use `install-deps-docker.ps1`** - Faster than full rebuild for quick dependency updates

## Security Considerations

- `--omit=dev` flag excludes development dependencies (smaller image)
- Alpine Linux base is minimal and secure
- No sensitive data baked into image
- `.env.production` loaded at runtime (not build time)

## Next Steps

1. ✅ Run `.\rebuild-docker.ps1` to start the container
2. ✅ Verify logs show "Dependencies installed successfully"
3. ✅ Test API endpoints are responding
4. ✅ Commit these files to git for team sharing
5. ✅ Update deployment documentation

---

**Created:** December 6, 2025
**Status:** Ready for deployment
**Tested with:** Node.js v22.21.1, Docker, Windows PowerShell
