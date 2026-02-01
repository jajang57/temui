@echo off
echo Stopping Temui App...

echo Sending shutdown signal...
curl -X POST http://localhost:8080/api/system/shutdown -H "X-App-Secret: internal-shutdown-trigger"
if %errorlevel% equ 0 (
    echo Shutdown signal sent successfully.
    goto :EOF
)

echo Warning: Graceful shutdown failed (server might not be running or is unresponsive).
echo Attempting to force kill process...
taskkill /IM temui.exe /F
echo Process killed.
pause
