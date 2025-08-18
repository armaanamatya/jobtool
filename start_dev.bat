@echo off
echo Starting JobTool development servers...
echo.
echo Starting Express server on port 3001...
start cmd /k "cd /d %~dp0 && npm run server"

echo.
echo Waiting 3 seconds for server to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting React frontend on port 3000...
start cmd /k "cd /d %~dp0 && set PORT=3000 && npm start"

echo.
echo Both servers are starting in separate windows.
echo Express API: http://localhost:3001
echo React App: http://localhost:3000
echo.
pause