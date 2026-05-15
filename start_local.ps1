# MindMood - Inicio Local

Write-Host "=== MindMood Local Server ===" -ForegroundColor Cyan
Write-Host "Iniciando API en http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener." -ForegroundColor Magenta

Set-Location -LiteralPath "$PSScriptRoot\ai_api"
python -m uvicorn main:app --host 0.0.0.0 --port 8000
