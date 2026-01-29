# Quick Deploy Script
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "}gElV!6,0XH%"
$REMOTE_PATH = "/epc.ylevigroup.com"

Write-Host "Desplegando archivos actualizados..."
Write-Host ""

# Upload index.html
Write-Host "1. Subiendo index.html..."
try {
    $uri = "ftp://$FTP_HOST$REMOTE_PATH/index.html"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    
    $content = [System.IO.File]::ReadAllBytes("dist/index.html")
    $request.ContentLength = $content.Length
    
    $stream = $request.GetRequestStream()
    $stream.Write($content, 0, $content.Length)
    $stream.Close()
    
    $response = $request.GetResponse()
    Write-Host "   OK" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Upload JS files
Write-Host "2. Subiendo archivos JS..."
$jsFiles = Get-ChildItem -Path "dist/assets" -Filter "*.js"
foreach ($file in $jsFiles) {
    Write-Host "   - $($file.Name)..."
    try {
        $uri = "ftp://$FTP_HOST$REMOTE_PATH/assets/$($file.Name)"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.UseBinary = $true
        
        $content = [System.IO.File]::ReadAllBytes($file.FullName)
        $request.ContentLength = $content.Length
        
        $stream = $request.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
        
        $response = $request.GetResponse()
        Write-Host "     OK" -ForegroundColor Green
        $response.Close()
    }
    catch {
        Write-Host "     Error" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Completado. Abre: https://epc.ylevigroup.com" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+Shift+R para limpiar cache" -ForegroundColor Yellow
Write-Host ""
