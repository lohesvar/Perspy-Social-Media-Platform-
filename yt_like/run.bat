@echo off
echo ====================================================
echo  Perspy - Premium Video & Text Sharing Platform   
echo  Theme: Blue Accent (Dark/Light Modes)
echo ====================================================

REM Navigate to script directory
cd /d "%~dp0"

REM Check if Python virtual environment exists
if not exist "venv" (
    echo [1/4] Creating Python virtual environment (venv)...
    python -m venv venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment. Make sure Python is installed.
        pause
        exit /b
    )
) else (
    echo [1/4] Python virtual environment (venv) already exists.
)

REM Activate virtual environment and install requirements
echo [2/4] Activating venv and installing packages...
call venv\Scripts\activate
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install requirements.
    pause
    exit /b
)

REM Initialize and seed the SQL database
echo [3/4] Initializing SQLite Database and Seeding Mock Data...
python db.py
if errorlevel 1 (
    echo Error: Database initialization failed.
    pause
    exit /b
)

REM Launch the local dev server
echo [4/4] Starting Flask Web Server...
echo.
echo ********************************************************
echo  Perspy server is running!
echo  Please open your browser and go to:
echo  http://127.0.0.1:5000
echo ********************************************************
echo.

python app.py

pause
