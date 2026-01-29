# Fix Permissions via FTP
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

Write-Host ""
Write-Host "Corrigiendo permisos de archivos..."
Write-Host ""

# Archivos a corregir
$files = @("index.html", ".htaccess", "test.html", "check.html")

foreach ($file in $files) {
    try {
        $uri = "ftp://$FTP_HOST/$file"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $request.Method = "SITE CHMOD 644 $file"
        
        $response = $request.GetResponse()
        Write-Host "OK: $file (permisos 644)" -ForegroundColor Green
        $response.Close()
    }
    catch {
        Write-Host "Info: $file - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Permisos actualizados. Verifica: https://epc.ylevigroup.com"
Write-Host ""
