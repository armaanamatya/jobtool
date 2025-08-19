# PowerShell script to create Windows Task Scheduler entry for JobTool
# Run as Administrator

$taskName = "JobTool Auto Startup"
$taskDescription = "Automatically starts JobTool server and scheduler on system boot"
$scriptPath = "C:\Users\armaa\OneDrive\Desktop\jobtool\start-jobtool.bat"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Task '$taskName' already exists. Removing old task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the action
$action = New-ScheduledTaskAction -Execute $scriptPath

# Create the trigger (at startup)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Create the principal (run as current user)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType ServiceAccount

# Create the settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register the task
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $taskDescription

Write-Host "✅ Task '$taskName' created successfully!" -ForegroundColor Green
Write-Host "   - Will run at system startup" -ForegroundColor Green
Write-Host "   - Starts both server and scheduler" -ForegroundColor Green
Write-Host ""
Write-Host "To manage this task:" -ForegroundColor Cyan
Write-Host "   1. Open Task Scheduler (taskschd.msc)" -ForegroundColor Cyan
Write-Host "   2. Look for '$taskName' in Task Scheduler Library" -ForegroundColor Cyan