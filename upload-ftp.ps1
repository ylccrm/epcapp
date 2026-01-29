# FTP Upload Script for EPC App
param(
    [string]$RemotePath = "/public_html/epc"
)

$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

Write-Host ""
Write-Host "========================================"
Write-Host "  FTP Upload - EPC App"
Write-Host "========================================"
Write-Host ""

# Test connection
Write-Host "Verificando conexion FTP..."

$testUri = "ftp://$FTP_HOST/"
$testRequest = [System.Net.FtpWebRequest]::Create($testUri)
$testRequest.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
$testRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
$testRequest.KeepAlive = $false

try {
    $testResponse = $testRequest.GetResponse()
    Write-Host "Conexion FTP exitosa" -ForegroundColor Green
    Write-Host ""
    $testResponse.Close()
}
catch {
    Write-Host "Error de conexion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Upload files
Write-Host "Subiendo archivos a: $RemotePath"
Write-Host ""

$files = Get-ChildItem -Path "dist" -Recurse -File
$total = $files.Count
$current = 0

foreach ($file in $files) {
    $current++
    $relative = $file.FullName.Substring((Get-Item "dist").FullName.Length + 1)
    $remote = "$RemotePath/$($relative -replace '\\', '/')"
    
    Write-Progress -Activity "Subiendo archivos" -Status "$current de $total" -PercentComplete (($current / $total) * 100)
    
    try {
        $uri = "ftp://$FTP_HOST$remote"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.UseBinary = $true
        $request.KeepAlive = $false
        
        $content = [System.IO.File]::ReadAllBytes($file.FullName)
        $request.ContentLength = $content.Length
        
        $stream = $request.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
        
        $response = $request.GetResponse()
        $response.Close()
        
        Write-Host "  OK: $relative" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $relative" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "  Subida Completada"
Write-Host "========================================"
Write-Host ""
Write-Host "Verifica: https://epc.ylevigroup.com"
Write-Host ""
