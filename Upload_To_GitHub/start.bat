@echo off
echo ===================================================
echo Welcome to YMH DRUG CHECK Startup Script!
echo ===================================================
echo.

echo Cleaning up old processes...
taskkill /F /IM node.exe >nul 2>&1

node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not working!
    echo Please download and install Node.js from https://nodejs.org
    echo After installing, restart your computer and try running this file again.
    pause
    exit
)

echo [1/3] Node.js is installed! Setting up AI Backend...
cd backend
call npm install
echo Starting Backend Server in a new window...
start cmd /k "title YMH AI Backend && npm run dev"

cd ..

echo [2/3] Setting up Frontend...
cd frontend
call npm install

echo [3/3] Starting the website...
echo (The website will open automatically in your browser shortly)
echo.
timeout /t 3 >nul

start http://localhost:5173
call npm run dev

pause
