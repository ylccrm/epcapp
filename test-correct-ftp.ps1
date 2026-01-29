# Test FTP Connection with Correct Credentials
$FTP_HOST = "ts3.a2hosting.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "}gElV!6,0XH%"

Write-Host ""
Write-Host "Probando conexion FTP con credenciales correctas..."
Write-Host ""
Write-Host "Host: $FTP_HOST"
Write-Host "User: $FTP_USER"
Write-Host ""

try {
    $uri = "ftp://$FTP_HOST/"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
    $request.KeepAlive = $false
    
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    Write-Host "Conexion exitosa!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Directorios disponibles:" -ForegroundColor Yellow
    Write-Host ""
    
    while (($line = $reader.ReadLine()) -ne $null) {
        Write-Host "  $line"
    }
    
    $reader.Close()
    $response.Close()
    
    Write-Host ""
    Write-Host "OK - Credenciales correctas" -ForegroundColor Green
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
