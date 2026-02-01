@echo off
echo Building Temui App for macOS...

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

echo [3/4] Building Backend for macOS (Intel amd64)...
cd backend
set GOOS=darwin
set GOARCH=amd64
go build -o temui-mac-intel main.go
if %errorlevel% neq 0 (
    echo Error: Backend build for Intel Mac failed.
    pause
    exit /b 1
)

echo [3/4] Building Backend for macOS (Apple Silicon arm64)...
set GOOS=darwin
set GOARCH=arm64
go build -o temui-mac-m1 main.go
if %errorlevel% neq 0 (
    echo Error: Backend build for Apple Silicon Mac failed.
    pause
    exit /b 1
)

REM Reset environment variables
set GOOS=
set GOARCH=
cd ..

echo.
echo ==========================================
echo Build Success!
echo macOS Binaries created:
echo - backend\temui-mac-intel
echo - backend\temui-mac-m1
echo ==========================================
pause
