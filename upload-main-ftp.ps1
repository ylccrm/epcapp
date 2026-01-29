# Move Files to Correct Location
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "ylevigro"
$FTP_PASS = "widEKrZiHO1Q1"

Write-Host ""
Write-Host "Conectando con cuenta principal..."
Write-Host ""

# Test connection
try {
    $uri = "ftp://$FTP_HOST/"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    
    $response = $request.GetResponse()
    Write-Host "Conexion exitosa" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "Error de conexion: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Subiendo archivos a /epc.ylevigroup.com..."
Write-Host ""

# Upload index.html
Write-Host "1. Subiendo index.html..."
try {
    $uri = "ftp://$FTP_HOST/epc.ylevigroup.com/index.html"
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

# Create assets directory
Write-Host "2. Creando carpeta assets..."
try {
    $uri = "ftp://$FTP_HOST/epc.ylevigroup.com/assets"
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

# Upload assets files
Write-Host "3. Subiendo archivos de assets..."
$assetsFiles = Get-ChildItem -Path "dist/assets" -File

foreach ($file in $assetsFiles) {
    Write-Host "   - $($file.Name)..."
    try {
        $uri = "ftp://$FTP_HOST/epc.ylevigroup.com/assets/$($file.Name)"
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
        Write-Host "     Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Archivos subidos correctamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifica: https://epc.ylevigroup.com" -ForegroundColor Cyan
Write-Host ""
