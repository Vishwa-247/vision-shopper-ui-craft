@echo off
echo ========================================
echo    Starting Interview Coach Service
echo ========================================
echo.

REM Change to backend directory
cd /d "%~dp0backend"

echo 📁 Current directory: %CD%
echo.

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)
echo ✅ Virtual environment activated
echo.

REM Start Interview Coach Service
echo 🎤 Starting Interview Coach Service on port 8002...
python agents\interview-coach\main.py

echo.
echo Press any key to exit...
pause
