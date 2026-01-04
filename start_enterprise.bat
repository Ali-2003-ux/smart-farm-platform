
@echo off
TITLE Smart Farm Enterprise Launcher
COLOR 0A

echo ===================================================
echo      SMART FARM ENTERPRISE - CLASSIFIED SYSTEM
echo ===================================================
echo.

set PYTHON_EXEC=

:: Strategy 1: Check Global PATH (and verify it's not the broken shim)
python --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('where python') do (
        echo [CHECK] Found global python: %%i
        if not "%%i"=="%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe" (
            set PYTHON_EXEC=python
            goto :FOUND
        )
    )
)

:: Strategy 2: Check standard install paths
echo [SYSTEM] Searching for Python installation...

set "CANDIDATES=%LOCALAPPDATA%\Programs\Python\Python312\python.exe;%LOCALAPPDATA%\Programs\Python\Python311\python.exe;%LOCALAPPDATA%\Programs\Python\Python310\python.exe;%LOCALAPPDATA%\Programs\Python\Python39\python.exe;C:\Python312\python.exe;C:\Python311\python.exe;C:\Python310\python.exe;C:\Python39\python.exe"

for %%P in ("%CANDIDATES:;=" "%") do (
    if exist "%%~P" (
        set "PYTHON_EXEC=%%~P"
        goto :FOUND
    )
)

:: Strategy 3: Deployment Fallback (Check if py launcher works)
py --version >nul 2>&1
if %errorlevel% equ 0 (
    set PYTHON_EXEC=py
    goto :FOUND
)

:NOT_FOUND
echo [CRITICAL ERROR] Could not locate a valid Python installation.
echo.
echo Searched locations:
echo - Global PATH
echo - %LOCALAPPDATA%\Programs\Python\...
echo - C:\PythonXX\...
echo.
echo Please install Python 3.10+ from python.org and ensure "Add to PATH" is checked.
pause
exit /b

:FOUND
echo [SYSTEM] Using Python Core: "%PYTHON_EXEC%"

:: 1. Backend Setup
echo.
echo [SYSTEM] Initializing Backend Core...
cd backend
echo [SYSTEM] Installing Dependencies...
"%PYTHON_EXEC%" -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Dependency install issue. Trying to proceed...
)

echo [SYSTEM] Launching API Server...
start "SmartFarm Backend API" cmd /k ""%PYTHON_EXEC%" -m uvicorn main:app --reload --port 8000"
cd ..

:: 2. Frontend Setup
echo.
echo [SYSTEM] Initializing Frontend Command Center...
cd frontend
echo [SYSTEM] Installing Node Modules (If needed)...
if not exist node_modules call npm install
echo [SYSTEM] Launching Interface...
start "SmartFarm Frontend UI" cmd /k "npm run dev"
cd ..

echo.
echo ===================================================
echo [SUCCESS] MISSION CONTROL IS LIVE
echo.
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000/docs
echo.
echo Press any key to exit this launcher...
pause
