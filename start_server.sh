#!/usr/bin/env bash
set -e

# Activate venv if present
if [ -f "./venv/Scripts/activate" ]; then
  source ./venv/Scripts/activate
elif [ -f "./venv/bin/activate" ]; then
  source ./venv/bin/activate
fi

if [ -z "$NGROK_TOKEN" ]; then
  echo "NGROK_TOKEN not set. Export NGROK_TOKEN before running or run: export NGROK_TOKEN=your_token"
else
  ngrok config add-authtoken "$NGROK_TOKEN" >/dev/null 2>&1 || true
fi

# Start FastAPI (uvicorn) and ngrok tunnel
nohup uvicorn api.main:app --host 0.0.0.0 --port 8000 >/dev/null 2>&1 &
nohup ngrok http 8000 >/dev/null 2>&1 &

echo "Started uvicorn on 0.0.0.0:8000 and ngrok tunnel. Use 'ps' to inspect processes or 'ngrok http 8000' to view tunnel."