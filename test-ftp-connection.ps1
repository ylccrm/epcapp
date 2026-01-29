# Test FTP Connection
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "}gElV!6,0XH%"

Write-Host ""
Write-Host "Probando conexion FTP a: $FTP_HOST"
Write-Host ""

try {
    $uri = "ftp://$FTP_HOST/"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
    $request.KeepAlive = $false
    $request.Timeout = 10000
    
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    Write-Host "CONEXION EXITOSA!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Directorios disponibles:" -ForegroundColor Yellow
    Write-Host ""
    
    $lineCount = 0
    while (($line = $reader.ReadLine()) -ne $null -and $lineCount -lt 10) {
        Write-Host "  $line"
        $lineCount++
    }
    
    $reader.Close()
    $response.Close()
    
    Write-Host ""
    Write-Host "OK - ftp.ylevigroup.com funciona correctamente" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "ERROR: No se puede conectar" -ForegroundColor Red
    Write-Host "Mensaje: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Probando con ts3.a2hosting.com..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $uri2 = "ftp://ts3.a2hosting.com/"
        $request2 = [System.Net.FtpWebRequest]::Create($uri2)
        $request2.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $request2.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
        $request2.KeepAlive = $false
        $request2.Timeout = 10000
        
        $response2 = $request2.GetResponse()
        Write-Host "OK - ts3.a2hosting.com funciona" -ForegroundColor Green
        $response2.Close()
    }
    catch {
        Write-Host "ERROR: Tampoco funciona ts3.a2hosting.com" -ForegroundColor Red
        Write-Host "Mensaje: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
