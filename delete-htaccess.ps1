# Delete .htaccess from server
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

Write-Host "Eliminando .htaccess del servidor..."

try {
    $uri = "ftp://$FTP_HOST/.htaccess"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    
    $response = $request.GetResponse()
    Write-Host "OK: .htaccess eliminado" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verifica ahora: https://epc.ylevigroup.com"
Write-Host "Si funciona, el problema era el .htaccess"
