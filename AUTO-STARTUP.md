# JobTool Auto-Startup Setup

This guide shows you how to make the JobTool scheduler run automatically when your computer starts.

## Option 1: PM2 Process Manager (Recommended)

PM2 is the best solution for Node.js applications with automatic restart, logging, and monitoring.

### Setup Steps:

1. **Run the setup script as Administrator:**
   ```cmd
   setup-autostart.bat
   ```

2. **Manual setup (if script fails):**
   ```cmd
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### PM2 Commands:
```cmd
pm2 status           # Check application status
pm2 logs             # View logs
pm2 logs jobtool-scheduler  # View only scheduler logs
pm2 restart all      # Restart both apps
pm2 stop all         # Stop both apps
pm2 delete all       # Remove from PM2
```

### Benefits:
- ✅ Automatic restart on crash
- ✅ Built-in logging
- ✅ Memory monitoring
- ✅ Runs as Windows service
- ✅ Easy management commands

---

## Option 2: Windows Task Scheduler

### Setup Steps:

1. **Run PowerShell as Administrator**
2. **Execute the task creation script:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   .\create-windows-task.ps1
   ```

3. **Alternative manual setup:**
   - Open Task Scheduler (`Win + R` → `taskschd.msc`)
   - Create Basic Task
   - Name: "JobTool Auto Startup"
   - Trigger: "When the computer starts"
   - Action: "Start a program"
   - Program: `C:\Users\armaa\OneDrive\Desktop\jobtool\start-jobtool.bat`

### Benefits:
- ✅ Native Windows integration
- ✅ No additional dependencies
- ✅ Easy to configure via GUI

---

## Option 3: Manual Startup

### Quick Start:
Double-click `start-jobtool.bat` to start both server and scheduler.

### Add to Windows Startup Folder:
1. Press `Win + R`, type `shell:startup`, press Enter
2. Copy `start-jobtool.bat` to this folder
3. Will run automatically on next login

---

## Verification

After setup, verify the scheduler is running:

### PM2:
```cmd
pm2 status
```

### Task Scheduler:
- Open Task Scheduler
- Check "JobTool Auto Startup" task status

### Manual Check:
1. Visit http://localhost:3001/api/jobs
2. Check if jobs are being populated
3. Look for `scraper.log` file with scheduled run logs

---

## Current Schedule

- **Daily scraping**: 4:00 PM CDT
- **Timezone**: America/Chicago (handles CDT/CST automatically)
- **Log file**: `scraper.log`

---

## Troubleshooting

### PM2 not found:
```cmd
npm install -g pm2
```

### Permission errors:
- Run Command Prompt as Administrator
- Ensure you have admin rights

### Scheduler not running:
```cmd
# PM2
pm2 restart jobtool-scheduler

# Manual
node scripts/startScheduler.js
```

### Check logs:
```cmd
# PM2 logs
pm2 logs jobtool-scheduler

# Manual log file
type scraper.log
```