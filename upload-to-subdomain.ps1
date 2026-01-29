# Upload to Correct Path
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"
$REMOTE_PATH = "/epc.ylevigroup.com"

Write-Host ""
Write-Host "Subiendo archivos a: $REMOTE_PATH"
Write-Host ""

# 1. Upload index.html
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

# 2. Create assets directory
Write-Host "2. Creando carpeta assets..."
try {
    $uri = "ftp://$FTP_HOST$REMOTE_PATH/assets"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    
    $response = $request.GetResponse()
    Write-Host "   OK" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "   Ya existe" -ForegroundColor Yellow
}

# 3. Upload assets files
Write-Host "3. Subiendo archivos de assets..."
$assetsFiles = Get-ChildItem -Path "dist/assets" -File

foreach ($file in $assetsFiles) {
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
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Archivos subidos correctamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifica: https://epc.ylevigroup.com" -ForegroundColor Cyan
Write-Host ""
