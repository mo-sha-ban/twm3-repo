# Docker Setup - Fix for Missing Dependencies

## Problem
The Docker container was failing to start because `npm install` was never executed, leaving `node_modules` empty. This caused the "Cannot find module 'nodemailer'" error.

## Solution
I've created a complete Docker setup with proper dependency installation:

### Files Created/Updated:
1. **`twm3-backend/Dockerfile`** - Multi-stage build that installs dependencies before starting
2. **`twm3-backend/entrypoint.sh`** - Startup script that ensures dependencies are installed
3. **`docker-compose.yml`** - Orchestration file for the container
4. **`rebuild-docker.ps1`** - PowerShell script to rebuild the Docker image
5. **`install-deps-docker.ps1`** - PowerShell script to install deps without rebuilding

## Quick Start

### Option 1: Full Rebuild (Recommended for First Time)
Run this command in PowerShell from the repository root:

```powershell
.\rebuild-docker.ps1
```

This will:
- Stop and remove the old container
- Remove the old Docker image
- Build a fresh image with `npm install` included
- Start the new container
- Show you the logs

### Option 2: Quick Fix (If Container Already Running)
If the container is already running and you just need to install dependencies:

```powershell
.\install-deps-docker.ps1
```

This will:
- Install dependencies in the running container
- Restart the container
- Show you the logs

### Option 3: Manual Docker Commands
```bash
# Navigate to repository root
cd d:\twm3-repo

# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

## How It Works

The Dockerfile now:
1. Uses Node.js 22 Alpine (lightweight)
2. Copies `package.json` and `package-lock.json`
3. Runs `npm ci --omit=dev` to install dependencies (creates node_modules)
4. Copies the rest of the application code
5. Uses an entrypoint script that:
   - Checks if node_modules exists
   - Installs dependencies if needed
   - Starts the server with `npm start`

## Verification

After starting the container, you should see:
- ✅ "Dependencies installed successfully"
- ✅ "Checking key dependencies" output showing nodemailer, express, mongoose
- ✅ Server listening on port 5000

## Troubleshooting

### Container still can't find modules?
```powershell
# Remove all Docker artifacts and rebuild completely
docker system prune -a
.\rebuild-docker.ps1
```

### Want to check what's in the container?
```powershell
# View container logs
docker-compose logs backend

# Shell into the container
docker exec -it twm3-backend sh

# Check if node_modules exists
docker exec twm3-backend ls -la node_modules | head -20

# Check specific module
docker exec twm3-backend npm list nodemailer
```

### Port already in use?
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "5001:5000"  # Maps host port 5001 to container port 5000
```

## Environment Variables

The container uses:
- `.env.production` - For production configuration
- `NODE_ENV=production` - Automatically set in docker-compose.yml
- `PORT=5000` - Default port (can be overridden in `.env.production`)

## Health Check

The container includes a health check that:
- Runs every 30 seconds
- Times out after 3 seconds
- Waits 40 seconds before first check
- Marks container unhealthy after 3 failures

Check health status with:
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Next Steps

1. Run `.\rebuild-docker.ps1` to build and start the container
2. Check the logs to verify everything is working
3. Test the API endpoints
4. Once working, you can use `docker-compose` commands directly:
   ```powershell
   docker-compose start    # Start stopped container
   docker-compose stop     # Stop running container
   docker-compose restart  # Restart container
   docker-compose logs -f  # Follow logs in real-time
   ```
