@echo off
echo Stopping DSA Feedback Service...
echo Finding processes on port 8009...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8009') do (
    echo Killing process %%a
    taskkill /PID %%a /F
)

echo DSA Feedback Service stopped.
pause
