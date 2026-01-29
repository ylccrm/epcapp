# ========================================
# Script de Configuración Rápida
# Despliegue Automático - EPC App
# ========================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔧 Configuración de Despliegue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Crear archivo de configuración local
Write-Host "📝 Paso 1: Configurar credenciales FTP locales" -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".deploy-config.json") {
    Write-Host "⚠️  Ya existe un archivo .deploy-config.json" -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($overwrite -ne "s") {
        Write-Host "✅ Manteniendo configuración existente" -ForegroundColor Green
        $skipConfig = $true
    }
}

if (-not $skipConfig) {
    Write-Host "Por favor, ingresa tus credenciales de A2 Hosting:" -ForegroundColor Cyan
    Write-Host ""
    
    $ftp_host = Read-Host "Servidor FTP (ejemplo: ftp.ylevigroup.com)"
    $ftp_user = Read-Host "Usuario FTP (ejemplo: usuario@ylevigroup.com)"
    $ftp_pass = Read-Host "Contraseña FTP" -AsSecureString
    $ftp_pass_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftp_pass)
    )
    
    $config = @{
        ftp_host        = $ftp_host
        ftp_user        = $ftp_user
        ftp_pass        = $ftp_pass_plain
        ftp_remote_path = "/public_html/crmylc"
    }
    
    $config | ConvertTo-Json | Out-File -FilePath ".deploy-config.json" -Encoding UTF8
    
    Write-Host ""
    Write-Host "✅ Configuración guardada en .deploy-config.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  📋 Siguiente: Configurar GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Para completar la configuración, necesitas agregar Secrets en GitHub:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a: https://github.com/ylccrm/epcapp/settings/secrets/actions" -ForegroundColor White
Write-Host ""
Write-Host "2. Agrega los siguientes secrets:" -ForegroundColor White
Write-Host ""

if (-not $skipConfig) {
    Write-Host "   FTP_SERVER = $ftp_host" -ForegroundColor Cyan
    Write-Host "   FTP_USERNAME = $ftp_user" -ForegroundColor Cyan
    Write-Host "   FTP_PASSWORD = [tu contraseña]" -ForegroundColor Cyan
}
else {
    $existing = Get-Content ".deploy-config.json" | ConvertFrom-Json
    Write-Host "   FTP_SERVER = $($existing.ftp_host)" -ForegroundColor Cyan
    Write-Host "   FTP_USERNAME = $($existing.ftp_user)" -ForegroundColor Cyan
    Write-Host "   FTP_PASSWORD = [tu contraseña]" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "3. También agrega las variables de Supabase:" -ForegroundColor White
Write-Host ""

if (Test-Path ".env") {
    $env_content = Get-Content ".env"
    $supabase_url = ($env_content | Select-String "VITE_SUPABASE_URL=").ToString().Split("=")[1]
    $supabase_key_line = ($env_content | Select-String "VITE_SUPABASE_ANON_KEY=").ToString()
    
    Write-Host "   VITE_SUPABASE_URL = $supabase_url" -ForegroundColor Cyan
    Write-Host "   VITE_SUPABASE_ANON_KEY = [tu clave de .env]" -ForegroundColor Cyan
}
else {
    Write-Host "   VITE_SUPABASE_URL = [tu URL de Supabase]" -ForegroundColor Cyan
    Write-Host "   VITE_SUPABASE_ANON_KEY = [tu clave de Supabase]" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Configuración Local Completa" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configura los GitHub Secrets (arriba)" -ForegroundColor White
Write-Host "2. Crea el subdominio 'crmylc' en A2 Hosting cPanel" -ForegroundColor White
Write-Host "3. Haz tu primer despliegue:" -ForegroundColor White
Write-Host ""
Write-Host "   git add ." -ForegroundColor Yellow
Write-Host "   git commit -m 'Configuración inicial'" -ForegroundColor Yellow
Write-Host "   git push origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. O despliega manualmente:" -ForegroundColor White
Write-Host ""
Write-Host "   powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message 'Primer despliegue'" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentación completa: SETUP-AUTO-DEPLOY.md" -ForegroundColor Gray
Write-Host ""
