# Upload All Files One by One
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

Write-Host ""
Write-Host "Subiendo archivos individuales..."
Write-Host ""

# Upload .htaccess
Write-Host "1. Subiendo .htaccess..."
try {
    $uri = "ftp://$FTP_HOST/.htaccess"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    
    $content = [System.IO.File]::ReadAllBytes("dist/.htaccess")
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

# Create assets directory
Write-Host "2. Creando carpeta assets..."
try {
    $uri = "ftp://$FTP_HOST/assets"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
    
    $response = $request.GetResponse()
    Write-Host "   OK" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "   Ya existe o error" -ForegroundColor Yellow
}

# Upload assets files
Write-Host "3. Subiendo archivos de assets..."
$assetsFiles = Get-ChildItem -Path "dist/assets" -File

foreach ($file in $assetsFiles) {
    Write-Host "   - $($file.Name)..."
    try {
        $uri = "ftp://$FTP_HOST/assets/$($file.Name)"
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
Write-Host "Completado. Verifica: https://epc.ylevigroup.com"
Write-Host ""
