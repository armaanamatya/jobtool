# PM2 Process Configuration Guide

## Overview
This document explains how to configure PM2 processes to start at boot and run on a schedule (every hour) on Windows systems.

## Current Issues with PM2 on Windows
- PM2's built-in startup feature (`pm2 startup`) doesn't work reliably on Windows
- Permission issues with named pipes (`EPERM //./pipe/rpc.sock`)
- Windows Service integration requires additional tools like `pm2-installer`

## Solutions

### 1. Windows Task Scheduler (Recommended)

#### Setup Auto-Start at Boot
```powershell
# Run as Administrator
powershell -ExecutionPolicy Bypass -File "create-windows-task.ps2"
```

This creates a scheduled task that:
- Runs at system startup
- Executes `start-jobtool.bat` 
- Starts both server and scheduler processes

#### Manual Task Creation
1. Open Task Scheduler (`taskschd.msc`)
2. Create Basic Task
3. Name: "JobTool Auto Startup"
4. Trigger: "When the computer starts"
5. Action: Start a program
6. Program: `C:\Users\armaa\OneDrive\Desktop\jobtool\start-jobtool.bat`

### 2. PM2 with Windows Service

#### Install PM2 Windows Service
```bash
# Install PM2 globally
npm install -g pm2

# Install PM2 Windows installer
npm install -g pm2-installer

# Run the installer (as Administrator)
pm2-installer
```

#### Configure Applications
```bash
# Start applications using ecosystem config
pm2 start ecosystem.config.js

# Save current process list
pm2 save

# Generate startup script (may not work on Windows)
pm2 startup
```

### 3. Hourly Execution Configuration

#### Option A: Cron in PM2 (ecosystem.config.js)
```javascript
{
  name: 'jobtool-scheduler',
  script: 'scripts/startScheduler.js',
  cron_restart: '0 * * * *', // Restart every hour
  restart_delay: 5000,
  max_restarts: 24, // Allow 24 restarts per day
  min_uptime: '30s'
}
```

#### Option B: Windows Task Scheduler
1. Create new task: "JobTool Hourly"
2. Trigger: Daily, repeat every 1 hour for duration of 1 day
3. Action: Start program `node scripts/startScheduler.js`
4. Working directory: `C:\Users\armaa\OneDrive\Desktop\jobtool`

#### Option C: Built-in Node-Cron
The scheduler already uses `node-cron` internally:
```javascript
// In cronScheduler.js
cron.schedule('0 16 * * *', async () => {
  // Runs daily at 4 PM CDT
});
```

To run every hour, modify to:
```javascript
cron.schedule('0 * * * *', async () => {
  // Runs every hour
});
```

## Current Configuration

### Ecosystem Config (`ecosystem.config.js`)
- **jobtool-server**: Runs `server.js` on port 3001
- **jobtool-scheduler**: Runs `scripts/startScheduler.js` with daily restart at midnight

### Batch Files
- `start-jobtool.bat`: Manual startup script
- `setup-autostart.bat`: PM2 installation and configuration
- `auto_scheduler.bat`: Alternative scheduler startup

## Troubleshooting

### PM2 Not Starting
```bash
# Kill PM2 daemon and restart
pm2 kill
pm2 start ecosystem.config.js

# Check process status
pm2 status
pm2 logs
```

### Permission Issues
- Run Command Prompt as Administrator
- Ensure user has proper permissions for PM2 directory (`C:\Users\username\.pm2`)

### Service Not Auto-Starting
1. Check Windows Services (`services.msc`) for PM2 service
2. Verify Task Scheduler entries
3. Test batch files manually first

## Recommended Setup

1. **For Boot Startup**: Use Windows Task Scheduler with `create-windows-task.ps1`
2. **For Hourly Execution**: Modify `cronScheduler.js` to use hourly cron pattern
3. **For Monitoring**: Use `pm2 monit` or `pm2 logs` to track processes

This approach is more reliable than PM2's native Windows startup integration.