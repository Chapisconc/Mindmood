@echo off
setlocal enabledelayedexpansion

REM Create venv if missing
if not exist venv (
  echo Creating virtualenv...
  python -m venv venv || (echo Failed to create venv & exit /b 1)
)

call venv\Scripts\activate.bat
necho.
echo Install/upgrade Python deps from api\requirements.txt? (Y/N)
set /p INSTALL_REQ=
if /I "%INSTALL_REQ%"=="Y" (
  echo Installing requirements...
  python -m pip install --upgrade pip setuptools wheel
  pip install -r api\requirements.txt
)

REM NGROK token handling: accepts token as first arg or uses NGROK_TOKEN env var or prompts the user
if "%~1"=="" (
  if "%NGROK_TOKEN%"=="" (
    echo NGROK_TOKEN not set. Enter ngrok token now (won't be saved), or press Enter to skip:
    set /p NGROK_TOKEN_INPUT=
    if not "%NGROK_TOKEN_INPUT%"=="" (
      set "NGROK_TOKEN=%NGROK_TOKEN_INPUT%"
      ngrok config add-authtoken "%NGROK_TOKEN%" >nul 2>&1 || echo Failed to add ngrok authtoken.
    ) else (
      echo Skipping ngrok auth configuration.
    )
  ) else (
    ngrok config add-authtoken "%NGROK_TOKEN%" >nul 2>&1 || echo Failed to add ngrok authtoken.
  )
) else (
  set "NGROK_TOKEN=%~1"
  ngrok config add-authtoken "%NGROK_TOKEN%" >nul 2>&1 || echo Failed to add ngrok authtoken.
)

echo Starting backend and ngrok tunnel...
start "uvicorn" cmd /c "venv\Scripts\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8000"
start "ngrok" cmd /c "ngrok http 8000"

echo Backend started on http://127.0.0.1:8000 (health: /health)
echo Ngrok web UI: http://127.0.0.1:4040

endlocal
exit /b 0
