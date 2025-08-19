@echo off
echo ====================================
echo JobTool Auto-Startup Setup
echo ====================================
echo.

echo Installing PM2 globally...
npm install -g pm2
if %errorlevel% neq 0 (
    echo Failed to install PM2. Please run as administrator.
    pause
    exit /b 1
)

echo.
echo Installing PM2 Windows service...
pm2-installer
if %errorlevel% neq 0 (
    echo Failed to install PM2 service. Please run as administrator.
    pause
    exit /b 1
)

echo.
echo Starting applications with PM2...
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo Your JobTool scheduler will now:
echo - Start automatically when Windows boots
echo - Run the scraper daily at 4 PM CDT
echo - Restart automatically if it crashes
echo.
echo Commands:
echo   pm2 status           - Check application status
echo   pm2 logs             - View logs
echo   pm2 restart all      - Restart both apps
echo   pm2 stop all         - Stop both apps
echo   pm2 delete all       - Remove from PM2
echo.
pause