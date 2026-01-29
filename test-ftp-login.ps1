# Test FTP Connection with Different User Formats
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_PASS = "widEKrZiHO1Q1"

Write-Host ""
Write-Host "Probando diferentes formatos de usuario..."
Write-Host ""

# Try 1: Just username
Write-Host "1. Probando: ylevigro"
try {
    $uri = "ftp://$FTP_HOST/"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential("ylevigro", $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    
    $response = $request.GetResponse()
    Write-Host "   OK - Este formato funciona" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "   Fallo: $($_.Exception.Message)" -ForegroundColor Red
}

# Try 2: Username with domain
Write-Host ""
Write-Host "2. Probando: ylevigro@ylevigroup.com"
try {
    $uri = "ftp://$FTP_HOST/"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential("ylevigro@ylevigroup.com", $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    
    $response = $request.GetResponse()
    Write-Host "   OK - Este formato funciona" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "   Fallo: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
