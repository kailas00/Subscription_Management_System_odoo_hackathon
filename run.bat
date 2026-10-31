@echo off
rem ============================================================
rem  Brightloop - one script to set up and run the app (Windows)
rem    run.bat         install if needed, update the database, start
rem    run.bat reset   same, but wipe the data and load fresh demo data
rem ============================================================
setlocal
cd /d "%~dp0"
title Brightloop
echo.
echo   BRIGHTLOOP - Subscription Management System
echo   -------------------------------------------
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)

set "LOAD_DEMO="
if /i "%~1"=="reset" set "LOAD_DEMO=1"

echo   [1/4] Closing Brightloop if it is already running...
for %%P in (4000 5173 5433) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do taskkill /F /T /PID %%I >nul 2>&1
)

echo   [2/4] Checking libraries...
if not exist "server\.env" copy "server\.env.example" "server\.env" >nul
if not exist "client\.env" copy "client\.env.example" "client\.env" >nul
if not exist "server\node_modules" (
  echo         First run: installing server libraries, 2-4 minutes...
  pushd server
  call npm install
  if errorlevel 1 goto fail
  popd
  set "LOAD_DEMO=1"
)
if not exist "client\node_modules" (
  echo         First run: installing website libraries, 1-2 minutes...
  pushd client
  call npm install
  if errorlevel 1 goto fail
  popd
)

pushd server
if defined LOAD_DEMO (
  echo   [3/4] Creating the database and loading demo data...
  call npm run db:setup
) else (
  echo   [3/4] Updating the database - your data is kept...
  call npm run db:update
)
if errorlevel 1 goto fail
popd

echo   [4/4] Starting the app...
findstr /C:":5433/" "server\.env" >nul && start "Brightloop database" /min cmd /k "cd /d "%~dp0server" && npm run db:local"
start "Brightloop server" cmd /k "cd /d "%~dp0server" && npm run dev"
start "Brightloop website" cmd /k "cd /d "%~dp0client" && npm run dev"
timeout /t 8 /nobreak >nul
start "" http://localhost:5173

echo.
echo   Running at http://localhost:5173  (password for demo logins: Admin@1234)
echo     admin@brightloop.dev  -  staff@brightloop.dev  -  customer@brightloop.dev
echo   To stop: close the "Brightloop server" and "Brightloop website" windows.
echo.
timeout /t 15 >nul
exit /b 0

:fail
echo.
echo   Something went wrong - read the message above.
pause
exit /b 1
