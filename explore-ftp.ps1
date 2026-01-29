# Script para Explorar y Subir por FTP
# ========================================

$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🔍 Explorador FTP - A2 Hosting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para listar directorios
function List-FTPDirectory {
    param([string]$path)
    
    try {
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FTP_HOST$path")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
        
        $response = $ftpRequest.GetResponse()
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        
        Write-Host "📁 Contenido de: $path" -ForegroundColor Yellow
        Write-Host ""
        
        while ($line = $reader.ReadLine()) {
            Write-Host $line
        }
        
        $reader.Close()
        $response.Close()
        
        return $true
    }
    catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
        return $false
    }
}

# Explorar directorios comunes
Write-Host "🔍 Explorando directorios en el servidor..." -ForegroundColor Yellow
Write-Host ""

# Raíz
Write-Host "1️⃣ Raíz del servidor:" -ForegroundColor Cyan
List-FTPDirectory "/"
Write-Host ""

# public_html
Write-Host "2️⃣ Carpeta public_html:" -ForegroundColor Cyan
List-FTPDirectory "/public_html/"
Write-Host ""

# Posible carpeta epc
Write-Host "3️⃣ Carpeta public_html/epc (si existe):" -ForegroundColor Cyan
List-FTPDirectory "/public_html/epc/"
Write-Host ""

# Ruta alternativa
Write-Host "4️⃣ Ruta alternativa epc.ylevigroup.com:" -ForegroundColor Cyan
List-FTPDirectory "/epc.ylevigroup.com/"
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Exploración Completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Revisa la salida arriba para encontrar la ruta correcta" -ForegroundColor Yellow
Write-Host ""
