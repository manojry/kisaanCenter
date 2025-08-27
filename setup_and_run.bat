@echo off
REM Windows Batch Script for KisaanCenter Setup and Run
REM Usage: setup_and_run.bat [port] [dev]

echo.
echo ============================================================
echo                   🌾 KISAAN CENTER 🌾
echo              Windows Setup and Run Script
echo ============================================================
echo.

REM Set default port
set PORT=8000
if not "%1"=="" set PORT=%1

REM Check for dev mode
set DEV_MODE=
if "%2"=="dev" set DEV_MODE=--dev

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Run the main setup script
echo 🚀 Running KisaanCenter setup...
python setup_and_run.py --port %PORT% %DEV_MODE%

if errorlevel 1 (
    echo.
    echo ❌ Setup failed. Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ KisaanCenter setup completed successfully!
pause
