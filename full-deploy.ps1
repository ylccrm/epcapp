# Complete Deploy - Upload ALL files
$FTP_HOST = "ftp.ylevigroup.com"
$FTP_USER = "epc_user@epc.ylevigroup.com"
$FTP_PASS = "}gElV!6,0XH%"
$REMOTE_PATH = "/epc.ylevigroup.com"

Write-Host ""
Write-Host "Desplegando TODOS los archivos..."
Write-Host ""

# Get all files recursively
$files = Get-ChildItem -Path "dist" -Recurse -File

$total = $files.Count
$current = 0

foreach ($file in $files) {
    $current++
    $relative = $file.FullName.Substring((Get-Item "dist").FullName.Length + 1)
    $remote = "$REMOTE_PATH/$($relative -replace '\\', '/')"
    
    Write-Progress -Activity "Subiendo archivos" -Status "$current de $total - $relative" -PercentComplete (($current / $total) * 100)
    
    # Create directory if needed
    $remoteDir = Split-Path $remote -Parent
    
    try {
        $uri = "ftp://$FTP_HOST$remote"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = New-Object System.Net.NetworkCredential($FTP_USER, $FTP_PASS)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $request.UseBinary = $true
        $request.KeepAlive = $false
        
        $content = [System.IO.File]::ReadAllBytes($file.FullName)
        $request.ContentLength = $content.Length
        
        $stream = $request.GetRequestStream()
        $stream.Write($content, 0, $content.Length)
        $stream.Close()
        
        $response = $request.GetResponse()
        $response.Close()
        
        Write-Host "  OK: $relative" -ForegroundColor Green
    }
    catch {
        Write-Host "  ERROR: $relative - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Completado!" -ForegroundColor Green
Write-Host "Abre: https://epc.ylevigroup.com y presiona Ctrl+Shift+R" -ForegroundColor Cyan
Write-Host ""
