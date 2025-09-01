@echo off
echo 🚀 Starting SafeCloud Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  .env file not found!
    echo Please copy env.example to .env and configure your values
    echo.
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo ✅ Starting server in development mode...
echo 📍 Server will be available at: http://localhost:8000
echo 📊 Health check: http://localhost:8000/health
echo 📝 Logs will be written to the logs/ directory
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
