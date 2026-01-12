@echo off
REM One Ops Dashboard Startup Script for Windows

echo =========================================
echo   One Ops Dashboard - Startup Script
echo =========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Warning: .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo .env file created. Please edit it with your Databricks credentials.
    echo.
    pause
)

REM Check if node_modules exists for backend
if not exist node_modules\express (
    echo Installing backend dependencies...
    call npm install express cors @databricks/sql dotenv
)

echo.
echo Starting backend server...
echo Backend will run on http://localhost:3001
echo.
echo To start frontend separately, run: npm run dev
echo.

REM Start the backend server
node server.js

pause
