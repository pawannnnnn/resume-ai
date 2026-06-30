@echo off
title ResumeAI - Starting Servers...
echo.
echo  ============================================
echo   ResumeAI - Server Launcher
echo  ============================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Backend (FastAPI on port 8000)...
cd backend
start "ResumeAI Backend" cmd /k "venv\Scripts\python main.py"
cd ..

echo [2/2] Starting Frontend (Next.js on port 3000)...
cd frontend
start "ResumeAI Frontend" cmd /k "npm run dev"
cd ..

echo.
echo  ============================================
echo   Both servers are starting!
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo  ============================================
echo.
echo  You can close this window. The servers
echo  run in their own terminal windows.
echo.
pause
