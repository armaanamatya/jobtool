@echo off
cd /d "C:\Users\armaa\OneDrive\Desktop\jobtool"

echo Starting JobTool Server...
start "JobTool Server" cmd /k "node server.js"

echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak > nul

echo Starting JobTool Scheduler...
start "JobTool Scheduler" cmd /k "node scripts/startScheduler.js"

echo JobTool started successfully!
echo Server: http://localhost:3001
echo Scheduler: Running (4 PM CDT daily)