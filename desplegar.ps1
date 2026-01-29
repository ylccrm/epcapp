# Script Simple de Despliegue
# Ejecuta esto cada vez que quieras desplegar cambios

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Desplegando a epc.ylevigroup.com" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build
Write-Host "1. Construyendo aplicacion..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en el build" -ForegroundColor Red
    exit 1
}

Write-Host "   Build completado" -ForegroundColor Green
Write-Host ""

# 2. Commit a GitHub
Write-Host "2. Guardando cambios en GitHub..." -ForegroundColor Yellow
git add .
$message = Read-Host "Mensaje de commit"
git commit -m "$message"
git push origin main

Write-Host "   Cambios guardados en GitHub" -ForegroundColor Green
Write-Host ""

# 3. Desplegar por FTP
Write-Host "3. Desplegando por FTP..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message "$message"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Despliegue Completado" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifica: https://epc.ylevigroup.com" -ForegroundColor Cyan
Write-Host ""
