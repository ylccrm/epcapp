# Upload Single File
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

$file = "dist/index.html"
$remoteName = "index.html"

Write-Host "Subiendo $remoteName..."

try {
    $uri = "ftp://$FTP_HOST/$remoteName"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.UseBinary = $true
    
    $content = [System.IO.File]::ReadAllBytes($file)
    $request.ContentLength = $content.Length
    
    $stream = $request.GetRequestStream()
    $stream.Write($content, 0, $content.Length)
    $stream.Close()
    
    $response = $request.GetResponse()
    Write-Host "OK: Archivo subido" -ForegroundColor Green
    $response.Close()
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
