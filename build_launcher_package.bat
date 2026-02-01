@echo off
setlocal
echo ==========================================
echo   BUILDING TEMUI LAUNCHER COMPLETE PACKAGE
echo ==========================================

REM Add Go bin to PATH
set "PATH=%PATH%;%USERPROFILE%\go\bin"

REM 1. Check & Install Wails
echo [1/5] Checking Wails...
where wails >nul 2>&1
if %errorlevel% neq 0 (
    echo Wails not found. Installing Wails...
    go install github.com/wailsapp/wails/v2/cmd/wails@latest
    if %errorlevel% neq 0 (
        echo Failed to install Wails. Please install manually or check Go setup.
        pause
        exit /b 1
    )
    REM Add Go bin to PATH for this session
    set "PATH=%PATH%;%USERPROFILE%\go\bin"
) else (
    echo Wails is installed.
)

REM 2. Create Output Directory
set OUT_DIR=TemuiLauncherRelease
if exist "%OUT_DIR%" rd /s /q "%OUT_DIR%"
mkdir "%OUT_DIR%"

REM 3. Build Backend (Renamed to backend.exe)
echo [2/5] Building Backend (as backend.exe)...
cd backend
set GOOS=windows
set GOARCH=amd64
go build -ldflags "-H=windowsgui" -o "../%OUT_DIR%/backend.exe" main.go
if %errorlevel% neq 0 (
    echo Failed to build backend.
    cd ..
    pause
    exit /b 1
)
cd ..

REM 4. Copy Frontend Assets (dist)
echo [3/5] Copying Frontend Assets...
if not exist "backend\dist" (
    echo Error: backend\dist missing. Please run build.bat first.
    pause
    exit /b 1
)
xcopy /E /I /Y "backend\dist" "%OUT_DIR%\dist"

REM 5. Build Launcher
echo [4/5] Building Launcher...
cd launcher
copy frontend\index.html frontend\dist\index.html /Y
call wails build
if %errorlevel% neq 0 (
    echo Failed to build launcher.
    cd ..
    pause
    exit /b 1
)
cd ..
copy "launcher\build\bin\temui-launcher.exe" "%OUT_DIR%\temui-launcher.exe"

REM 6. Copy Config
echo [5/5] Copying .env...
if exist "backend\.env" (
    copy "backend\.env" "%OUT_DIR%\.env"
) else (
    echo Warning: .env not found. Please configure manually.
)

echo.
echo ==========================================
echo BUILD SUCCESS!
echo Result folder: %OUT_DIR%
echo ==========================================
echo You can now rename requirements and zip this folder.
pause
