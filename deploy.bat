@echo off
echo ===================================================
echo           PRNTEZ PRODUCTION VPS DEPLOYMENT
echo ===================================================
echo.
echo Target Server: root@104.207.83.125
echo Target Path  : /var/www/deploy.zip
echo.

set "ZIP_PATH=%~dp0deploy.zip"

echo [*] Preparing and building fresh deployment package (Vite client + Server)...
node "%~dp0prepare_deploy.js"

if not exist "%ZIP_PATH%" (
    echo [X] Failed to create deploy.zip. Aborting.
    pause
    exit /b 1
)

echo [*] Uploading deploy.zip to VPS...
scp "%ZIP_PATH%" root@104.207.83.125:/var/www/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] SCP upload failed. Please verify your SSH password or connection.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [✓] deploy.zip uploaded successfully!
echo.
echo [*] Deploying on server and restarting PM2...
ssh root@104.207.83.125 "cd /var/www && unzip -o deploy.zip -d /var/www/prntez && cd /var/www/prntez && npm --prefix server install --production && pm2 restart prntez && pm2 status"

echo.
echo ===================================================
echo [✓] DEPLOYMENT COMPLETE! Site live at: https://prntez.com
echo ===================================================
pause
