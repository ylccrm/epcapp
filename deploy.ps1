# ========================================
# Script de Despliegue Automático a A2 Hosting
# ========================================

param(
    [string]$Message = "Actualización automática"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🚀 EPC App - Despliegue Automático" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuración - EDITA ESTOS VALORES
$FTP_HOST = "ftp.ylevigroup.com"  # Tu servidor FTP
$FTP_USER = "epc_user@epc.ylevigroup.com"  # Tu usuario FTP
$FTP_PASS = "Israel2025@"  # Tu contraseña FTP
$FTP_REMOTE_PATH = "/home/ylevigro/epc.ylevigroup.com/epc_user"  # Ruta remota en el servidor

# Verificar si existe el archivo de configuración
$configFile = ".deploy-config.json"
if (Test-Path $configFile) {
    Write-Host "📝 Cargando configuración desde $configFile..." -ForegroundColor Yellow
    $config = Get-Content $configFile | ConvertFrom-Json
    $FTP_HOST = $config.ftp_host
    $FTP_USER = $config.ftp_user
    $FTP_PASS = $config.ftp_pass
    $FTP_REMOTE_PATH = $config.ftp_remote_path
}

# Paso 1: Construir la aplicación
Write-Host "📦 Paso 1: Construyendo la aplicación..." -ForegroundColor Yellow
Write-Host ""

$nodePath = (Get-ChildItem "C:\Users\Administrator\AppData\Local\ms-playwright-go" -Recurse -Filter "node.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).DirectoryName

if (-not $nodePath) {
    Write-Host "❌ Error: Node.js no encontrado" -ForegroundColor Red
    exit 1
}

$env:PATH = "$nodePath;" + $env:PATH

# Construir
& .\node_modules\.bin\vite.cmd build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en el build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completado exitosamente" -ForegroundColor Green
Write-Host ""

# Paso 2: Subir archivos por FTP
Write-Host "📤 Paso 2: Subiendo archivos al servidor..." -ForegroundColor Yellow
Write-Host ""

# Crear script WinSCP
$winscp_script = @"
option batch abort
option confirm off
open ftp://${FTP_USER}:${FTP_PASS}@${FTP_HOST}/
cd ${FTP_REMOTE_PATH}
put dist\* 
exit
"@

$winscp_script | Out-File -FilePath "deploy-script.txt" -Encoding ASCII

# Verificar si WinSCP está instalado
$winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"
if (-not (Test-Path $winscpPath)) {
    Write-Host "⚠️  WinSCP no encontrado. Intentando con PowerShell FTP..." -ForegroundColor Yellow
    
    # Usar FTP nativo de PowerShell
    try {
        # Crear cliente FTP
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FTP_HOST$FTP_REMOTE_PATH/")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        
        Write-Host "✅ Conexión FTP establecida" -ForegroundColor Green
        
        # Subir archivos
        $files = Get-ChildItem -Path "dist" -Recurse -File
        $totalFiles = $files.Count
        $currentFile = 0
        
        foreach ($file in $files) {
            $currentFile++
            $relativePath = $file.FullName.Substring((Get-Item "dist").FullName.Length + 1)
            $uri = "ftp://$FTP_HOST$FTP_REMOTE_PATH/$($relativePath -replace '\\', '/')"
            
            Write-Progress -Activity "Subiendo archivos" -Status "$currentFile de $totalFiles" -PercentComplete (($currentFile / $totalFiles) * 100)
            
            $ftpRequest = [System.Net.FtpWebRequest]::Create($uri)
            $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
            $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            
            $fileContent = [System.IO.File]::ReadAllBytes($file.FullName)
            $ftpRequest.ContentLength = $fileContent.Length
            
            $requestStream = $ftpRequest.GetRequestStream()
            $requestStream.Write($fileContent, 0, $fileContent.Length)
            $requestStream.Close()
            
            $response = $ftpRequest.GetResponse()
            $response.Close()
        }
        
        Write-Host "✅ Archivos subidos exitosamente" -ForegroundColor Green
        
    }
    catch {
        Write-Host "❌ Error al subir archivos: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Solución: Instala WinSCP o configura las credenciales FTP correctamente" -ForegroundColor Yellow
        Write-Host "   Descarga WinSCP: https://winscp.net/eng/download.php" -ForegroundColor Cyan
        exit 1
    }
    
}
else {
    # Usar WinSCP
    & $winscpPath /script=deploy-script.txt
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Archivos subidos exitosamente" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Error al subir archivos" -ForegroundColor Red
        exit 1
    }
}

# Limpiar archivos temporales
Remove-Item "deploy-script.txt" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Despliegue Completado" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Tu aplicación está disponible en:" -ForegroundColor Cyan
Write-Host "   https://epc.ylevigroup.com" -ForegroundColor White
Write-Host ""
Write-Host "📝 Mensaje: $Message" -ForegroundColor Gray
Write-Host ""

# Registrar el despliegue
$deployLog = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    message   = $Message
    status    = "success"
} | ConvertTo-Json

Add-Content -Path ".deploy-log.json" -Value $deployLog
