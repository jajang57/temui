@echo off
echo ========================================
echo   TEMUI - Complete Build Script
echo ========================================
echo.

REM Step 1: Build Frontend
echo [1/4] Building Frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
cd ..
echo Frontend build completed!
echo.

REM Step 2: Copy Frontend to Backend
echo [2/4] Copying Frontend to Backend...
if exist "backend\dist" rmdir /s /q "backend\dist"
xcopy "frontend\dist" "backend\dist\" /E /I /Y
echo Frontend copied to backend!
echo.

REM Step 3: Build Backend
echo [3/4] Building Backend...
cd backend
go build -o temui-backend.exe .
if errorlevel 1 (
    echo ERROR: Backend build failed!
    pause
    exit /b 1
)
cd ..
echo Backend build completed!
echo.

REM Step 4: Build Launcher
echo [4/4] Building Launcher...
cd launcher
wails build
if errorlevel 1 (
    echo ERROR: Launcher build failed!
    pause
    exit /b 1
)
cd ..
echo Launcher build completed!
echo.

REM Step 5: Package Release
echo [5/5] Packaging Release...
if not exist "release" mkdir release
copy "launcher\build\bin\temui-launcher.exe" "release\" /Y
copy "backend\temui-backend.exe" "release\" /Y
copy "backend\temui-backend.exe" "release\backend.exe" /Y
if exist "release\dist" rmdir /s /q "release\dist"
xcopy "backend\dist" "release\dist\" /E /I /Y
copy "backend\.env" "release\" /Y
echo.

echo ========================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Release package is ready in: release\
echo.
echo Files included:
echo   - temui-launcher.exe (Launcher)
echo   - backend.exe (Backend Server)
echo   - dist\ (Frontend Assets)
echo   - .env (Configuration)
echo.
echo To run: Double-click release\temui-launcher.exe
echo.
pause
