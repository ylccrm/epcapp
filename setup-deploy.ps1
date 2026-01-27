Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔧 Configuración de Despliegue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya existe configuración
if (Test-Path ".deploy-config.json") {
    Write-Host "⚠️  Ya existe un archivo de configuración." -ForegroundColor Yellow
    $overwrite = Read-Host "¿Deseas sobrescribirlo? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Configuración cancelada." -ForegroundColor Gray
        exit 0
    }
}

Write-Host "Vamos a configurar el despliegue automático a A2 Hosting" -ForegroundColor White
Write-Host ""

# Solicitar información
Write-Host "📝 Ingresa la información de tu servidor FTP:" -ForegroundColor Yellow
Write-Host ""

$ftp_host = Read-Host "Servidor FTP (ejemplo: ftp.ylevigroup.com)"
if ([string]::IsNullOrWhiteSpace($ftp_host)) {
    $ftp_host = "ftp.ylevigroup.com"
}

$ftp_user = Read-Host "Usuario FTP (ejemplo: usuario@ylevigroup.com)"
if ([string]::IsNullOrWhiteSpace($ftp_user)) {
    Write-Host "❌ El usuario es obligatorio" -ForegroundColor Red
    exit 1
}

$ftp_pass = Read-Host "Contraseña FTP" -AsSecureString
$ftp_pass_plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ftp_pass)
)

if ([string]::IsNullOrWhiteSpace($ftp_pass_plain)) {
    Write-Host "❌ La contraseña es obligatoria" -ForegroundColor Red
    exit 1
}

$ftp_remote_path = Read-Host "Ruta remota (ejemplo: /public_html/epc)"
if ([string]::IsNullOrWhiteSpace($ftp_remote_path)) {
    $ftp_remote_path = "/public_html/epc"
}

# Crear objeto de configuración
$config = @{
    ftp_host        = $ftp_host
    ftp_user        = $ftp_user
    ftp_pass        = $ftp_pass_plain
    ftp_remote_path = $ftp_remote_path
}

# Guardar configuración
$config | ConvertTo-Json | Out-File -FilePath ".deploy-config.json" -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Configuración Guardada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Archivo creado: .deploy-config.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Seguridad:" -ForegroundColor Yellow
Write-Host "   - Este archivo NO se subirá a GitHub (.gitignore)" -ForegroundColor White
Write-Host "   - Mantén tus credenciales seguras" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Próximo paso:" -ForegroundColor Cyan
Write-Host "   Ejecuta el despliegue con:" -ForegroundColor White
Write-Host "   powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Message `"Mi primer despliegue`"" -ForegroundColor Green
Write-Host ""

# Preguntar si desea hacer un despliegue de prueba
$test_deploy = Read-Host "¿Deseas hacer un despliegue de prueba ahora? (s/n)"
if ($test_deploy -eq "s" -or $test_deploy -eq "S") {
    Write-Host ""
    Write-Host "🚀 Iniciando despliegue de prueba..." -ForegroundColor Yellow
    & .\deploy.ps1 -Message "Despliegue de prueba - Configuración inicial"
}
