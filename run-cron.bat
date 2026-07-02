@echo off
cd /d "%~dp0"
echo ===================================================
echo   YTAutoMate: Running Scheduled Video Uploads...
echo ===================================================
npm run cron
echo ===================================================
echo   Finished!
echo ===================================================
pause
