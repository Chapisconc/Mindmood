# MindMood - Inicio Local + Cloudflare Tunnel
# Requiere: cloudflared instalado (https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

Write-Host "=== MindMood Local Server ===" -ForegroundColor Cyan

# 1. Verificar cloudflared
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: cloudflared no instalado." -ForegroundColor Red
    Write-Host "Descargalo de: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" -ForegroundColor Yellow
    exit 1
}

# 2. Iniciar API en segundo plano
Write-Host "Iniciando API en http://127.0.0.1:8000 ..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    Set-Location -LiteralPath "$using:PSScriptRoot\ai_api"
    python -m uvicorn main:app --host 0.0.0.0 --port 8000
}

Start-Sleep -Seconds 3

# 3. Iniciar Cloudflare Tunnel
Write-Host "Iniciando Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host "La URL pública aparecera abajo (trycloudflare.com)" -ForegroundColor Yellow
Write-Host "Copia esa URL y usala como VITE_API_TUNNEL_URL en Vercel" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C para detener todo." -ForegroundColor Magenta

try {
    cloudflared tunnel --url http://localhost:8000
} finally {
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
}
