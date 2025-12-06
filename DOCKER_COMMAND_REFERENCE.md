# Docker Command Reference Card

## 🚀 Start/Stop Container

```powershell
# Start container
docker-compose up -d

# Stop container
docker-compose stop

# Restart container
docker-compose restart

# Remove container (keeps data in volumes)
docker-compose down

# Remove everything including volumes
docker-compose down -v
```

## 🔨 Build & Rebuild

```powershell
# Rebuild with latest code
.\rebuild-docker.ps1

# Build without cache (complete rebuild)
docker-compose build --no-cache

# Build specific service
docker-compose build backend

# Quick rebuild (don't rebuild if no changes)
docker-compose build
```

## 📋 View Logs

```powershell
# Follow logs in real-time
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50

# Specific number of lines
docker-compose logs -f --tail=100

# See logs from specific service
docker-compose logs backend

# See logs with timestamps
docker-compose logs -t

# Clear logs and follow new ones
docker-compose logs -f --no-log-prefix
```

## 🔍 Inspect Container

```powershell
# List containers
docker ps

# List all containers (including stopped)
docker ps -a

# View detailed container info
docker inspect twm3-backend

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"

# View container resources usage
docker stats twm3-backend

# Check container IP
docker inspect twm3-backend | findstr IPAddress
```

## 🐚 Shell into Container

```powershell
# Open shell in container
docker exec -it twm3-backend sh

# Inside container:
ls                              # List files
pwd                             # Current directory
ps aux                          # Running processes
npm list                        # Installed packages
npm list nodemailer             # Check specific package
cat package.json                # View package.json
node --version                  # Node version
npm --version                   # NPM version
exit                            # Exit shell
```

## 🔧 Run Commands in Container

```powershell
# List node_modules
docker exec twm3-backend ls node_modules

# Count packages
docker exec twm3-backend ls node_modules | wc -l

# Install packages
docker exec twm3-backend npm ci --omit=dev

# Run npm script
docker exec twm3-backend npm run test

# Check if module exists
docker exec twm3-backend npm list nodemailer

# View full output of npm list
docker exec twm3-backend npm list --depth=0
```

## 🧹 Cleanup & Troubleshooting

```powershell
# Remove unused Docker resources
docker system prune

# Remove everything (careful!)
docker system prune -a

# Remove specific image
docker rmi twm3-backend:latest

# Stop all containers
docker stop $(docker ps -q)

# Remove all stopped containers
docker container prune

# View Docker disk usage
docker system df

# Remove dangling images
docker image prune
```

## 🔀 Port Management

```powershell
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill process using port (replace PID with actual)
taskkill /PID <PID> /F

# Map different port in compose
# Edit docker-compose.yml:
# ports:
#   - "5001:5000"
```

## 📊 Monitoring

```powershell
# Real-time stats
docker stats

# Stats for specific container
docker stats twm3-backend

# Events in real-time
docker events --filter container=twm3-backend

# Check logs for errors
docker-compose logs backend | findstr error

# Check logs for specific text
docker-compose logs | findstr "nodemailer\|listening"
```

## 🛠️ Debugging

```powershell
# Rebuild with npm install debug output
docker-compose up --build backend

# View full build process
docker-compose build --no-cache --progress=plain

# Get verbose logs
docker-compose -f docker-compose.yml up backend

# Check entrypoint script output
docker exec twm3-backend cat /app/entrypoint.sh

# Run entrypoint manually for debugging
docker exec twm3-backend sh -x /app/entrypoint.sh
```

## 📦 Dependency Management

```powershell
# Install deps without rebuilding (quick fix)
.\install-deps-docker.ps1

# Manually install in running container
docker exec twm3-backend npm ci --omit=dev

# Update dependencies (use with caution)
docker exec twm3-backend npm update

# List outdated packages
docker exec twm3-backend npm outdated

# Check for security vulnerabilities
docker exec twm3-backend npm audit

# Fix security vulnerabilities
docker exec twm3-backend npm audit fix
```

## 🔌 Network & Ports

```powershell
# List exposed ports
docker port twm3-backend

# Access container locally
curl http://localhost:5000

# Check if port responds
Test-NetConnection -ComputerName localhost -Port 5000

# View network
docker network ls

# Inspect network
docker network inspect twm3-network
```

## 💾 Data & Volumes

```powershell
# List volumes
docker volume ls

# Inspect volume
docker volume inspect twm3-backend_uploads

# View volume location
docker inspect twm3-backend | findstr -A 10 Mounts

# Backup volume
docker run --rm -v twm3-backend_uploads:/data -v $PWD:/backup alpine tar czf /backup/data.tar.gz -C /data .

# List files in volume
docker run --rm -v twm3-backend_uploads:/data alpine ls -la /data
```

## 🔐 Security & Best Practices

```powershell
# Run container as non-root (check if configured)
docker inspect twm3-backend | findstr -i user

# Check for privileged mode
docker inspect twm3-backend | findstr -i privileged

# View mounted volumes
docker inspect twm3-backend | findstr -A 5 Mounts

# Check environment variables
docker exec twm3-backend printenv | grep -i env
```

## 📝 Important Files

```
d:\twm3-repo\
├── docker-compose.yml          # Main Docker config
├── .dockerignore               # Files to exclude from build
├── rebuild-docker.ps1          # Rebuild script
├── install-deps-docker.ps1     # Install deps script
├── test-docker-setup.ps1       # Test setup script
└── twm3-backend/
    ├── Dockerfile              # Build instructions
    ├── entrypoint.sh           # Startup script
    ├── package.json            # Dependencies
    └── package-lock.json       # Locked versions
```

## ⚡ Quick Scripts

```powershell
# One-liner to rebuild and watch logs
.\rebuild-docker.ps1 ; docker-compose logs -f

# Restart and tail logs
docker-compose restart backend ; docker-compose logs -f backend

# Full diagnostic output
Write-Host "Container Status:"; docker ps | findstr twm3-backend; Write-Host "`nLogs:"; docker-compose logs --tail=30 backend; Write-Host "`nPackages:"; docker exec twm3-backend npm list nodemailer
```

---

**Save this file for quick reference while working with Docker!**
**Last Updated:** December 6, 2025
