# List FTP Directories
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "Israel2025@"

Write-Host ""
Write-Host "Listando directorios FTP..."
Write-Host ""

$uri = "ftp://$FTP_HOST/"
$request = [System.Net.FtpWebRequest]::Create($uri)
$request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
$request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
$request.KeepAlive = $false

try {
    $response = $request.GetResponse()
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    
    while (($line = $reader.ReadLine()) -ne $null) {
        Write-Host $line
    }
    
    $reader.Close()
    $response.Close()
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
