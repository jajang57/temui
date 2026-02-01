@echo off
echo Packaging Temui App for macOS Deployment...

if not exist "release_mac" mkdir "release_mac"

echo [1/4] Copying Binaries...
if exist "backend\temui-mac-intel" (
    copy "backend\temui-mac-intel" "release_mac\temui-mac-intel"
) else (
    echo Error: backend\temui-mac-intel not found. Run build_mac.bat first.
    pause
    exit /b 1
)

if exist "backend\temui-mac-m1" (
    copy "backend\temui-mac-m1" "release_mac\temui-mac-m1"
) else (
    echo Error: backend\temui-mac-m1 not found. Run build_mac.bat first.
    pause
    exit /b 1
)

echo [2/4] Copying Frontend Assets...
if exist "backend\dist" (
    xcopy /E /I /Y "backend\dist" "release_mac\dist"
) else (
    echo Error: backend\dist not found. Run build_mac.bat first.
    pause
    exit /b 1
)

echo [3/4] Copying Configuration...
if exist "backend\.env" (
    copy "backend\.env" "release_mac\.env"
    echo Note: backend\.env copied. Please ensure it is configured for the client server.
) else (
    echo Warning: backend\.env not found. Please create one in the release_mac folder.
)

echo [4/4] Copying Helper Scripts...
copy "stop.sh" "release_mac\stop.sh"
copy "run_mac.sh" "release_mac\run_mac.sh"

echo [5/4] Building macOS App Bundle (Temui.app)...
set APP_DIR=release_mac\Temui.app
set CONTENTS_DIR=%APP_DIR%\Contents
set MACOS_DIR=%CONTENTS_DIR%\MacOS
set RESOURCES_DIR=%CONTENTS_DIR%\Resources

if exist "%APP_DIR%" rd /s /q "%APP_DIR%"
mkdir "%MACOS_DIR%"
mkdir "%RESOURCES_DIR%"

echo   - Copying Info.plist...
copy "Info.plist" "%CONTENTS_DIR%\Info.plist"

echo   - Copying Launcher...
copy "launcher_mac.sh" "%MACOS_DIR%\TemuiLauncher"
REM Note: Launcher needs to be executable. User must chmod +x on Mac.

echo   - Copying Binaries to MacOS...
copy "backend\temui-mac-intel" "%MACOS_DIR%\temui-mac-intel"
copy "backend\temui-mac-m1" "%MACOS_DIR%\temui-mac-m1"

echo   - Copying Assets to Resources...
xcopy /E /I /Y "backend\dist" "%RESOURCES_DIR%\dist"
copy "backend\.env" "%RESOURCES_DIR%\.env"

echo.
echo ==========================================
echo Package Created Successfully in 'release_mac' folder!
echo.
echo You have TWO options to run the app:
echo.
echo OPTION A: Double-Click App (Recommended)
echo 1. Copy 'Temui.app' to your Mac.
echo 2. Open Terminal and run: chmod +x Temui.app/Contents/MacOS/TemuiLauncher
echo 3. Double-click 'Temui.app' to run.
echo.
echo OPTION B: Manual Script
echo 1. Open Terminal.
echo 2. chmod +x temui-mac-m1 stop.sh
echo 3. ./temui-mac-m1
echo ==========================================
pause
