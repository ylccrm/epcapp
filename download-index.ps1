# Download index.html from server
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "}gElV!6,0XH%"
$REMOTE_PATH = "/epc.ylevigroup.com"

Write-Host "Descargando index.html del servidor..."

try {
    $uri = "ftp://$FTP_HOST$REMOTE_PATH/index.html"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::DownloadFile
    
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    $content = $reader.ReadToEnd()
    
    $reader.Close()
    $response.Close()
    
    Write-Host "Contenido del index.html en el servidor:"
    Write-Host "=========================================="
    Write-Host $content
    Write-Host "=========================================="
    
    # Save to file
    $content | Out-File -FilePath "server-index.html" -Encoding UTF8
    Write-Host ""
    Write-Host "Guardado en: server-index.html"
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
