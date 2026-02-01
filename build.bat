@echo off
echo Building Temui App for Windows...

echo [1/4] Checking requirements...
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH.
    pause
    exit /b 1
)

echo [2/4] Building Frontend Assets...
cd frontend
call npm install
call npm run build
cd ..
if exist "backend\dist" rd /s /q "backend\dist"
mkdir "backend\dist"
xcopy /E /I /Y "frontend\dist" "backend\dist"

echo [3/4] Building Backend Executable (Hidden Console)...
cd backend
REM Explicitly set Windows Environment to prevent cross-compilation leaks
set GOOS=windows
set GOARCH=amd64
go build -ldflags "-H=windowsgui" -o temui.exe main.go
if %errorlevel% neq 0 (
    echo Error: Backend build failed.
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo Build Success!
echo Run the app using: backend\temui.exe
echo To stop the app, run: stop.bat
echo ==========================================
pause
