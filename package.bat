@echo off
echo Packaging Temui App for Deployment...

if not exist "release" mkdir "release"

echo [1/4] Copying Executable...
if exist "backend\temui.exe" (
    copy "backend\temui.exe" "release\temui.exe"
) else (
    echo Error: backend\temui.exe not found. Run build.bat first.
    pause
    exit /b 1
)

echo [2/4] Copying Frontend Assets...
if exist "backend\dist" (
    xcopy /E /I /Y "backend\dist" "release\dist"
) else (
    echo Error: backend\dist not found. Run build.bat first.
    pause
    exit /b 1
)

echo [3/4] Copying Configuration...
if exist "backend\.env" (
    copy "backend\.env" "release\.env"
    echo Note: backend\.env copied. Please ensure it is configured for the client server.
) else (
    echo Warning: backend\.env not found. Please create one in the release folder.
)

echo [4/4] Copying Helper Scripts...
copy "stop.bat" "release\stop.bat"

echo.
echo ==========================================
echo Package Created Successfully in 'release' folder!
echo.
echo Contents to send to Client Server:
echo 1. temui.exe
echo 2. dist (folder)
echo 3. .env
echo 4. stop.bat
echo.
echo IMPORTANT:
echo - Ensure the client server has the same DB configuration in .env
echo - Run temui.exe to start the application.
echo ==========================================
pause
