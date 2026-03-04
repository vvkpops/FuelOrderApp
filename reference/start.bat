@echo off
echo ================================================
echo    Fuel Ordering Application - Quick Start
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9 or higher from python.org
    pause
    exit /b 1
)

echo [1/4] Checking Python installation...
python --version
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo [2/4] Creating virtual environment...
    python -m venv venv
    echo Virtual environment created successfully!
    echo.
) else (
    echo [2/4] Virtual environment already exists
    echo.
)

REM Activate virtual environment
echo [3/4] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo [4/4] Installing dependencies...
pip install -r requirements.txt
echo.

REM Check for configuration
if not exist ".env" (
    echo ================================================
    echo   IMPORTANT: Configuration Required!
    echo ================================================
    echo.
    echo The .env file does not exist yet.
    echo.
    echo Please follow these steps:
    echo   1. Copy .env.example to .env
    echo   2. Edit .env with your actual credentials
    echo   3. Set up Google Sheets API credentials
    echo   4. Configure email settings
    echo.
    echo See SETUP_GUIDE.md for detailed instructions.
    echo.
    pause
    exit /b 1
)

if not exist "credentials.json" (
    echo ================================================
    echo   WARNING: Google Credentials Missing!
    echo ================================================
    echo.
    echo The credentials.json file is not found.
    echo.
    echo Please download it from Google Cloud Console
    echo and place it in this directory.
    echo.
    echo See SETUP_GUIDE.md for instructions.
    echo.
    pause
)

echo ================================================
echo   Starting Fuel Ordering Application...
echo ================================================
echo.
echo Application will be available at:
echo   http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ================================================
echo.

python app.py
