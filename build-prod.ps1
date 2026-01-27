Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Building EPC App for Production" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Buscar Node.js
$nodePath = (Get-ChildItem "C:\Users\Administrator\AppData\Local\ms-playwright-go" -Recurse -Filter "node.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).DirectoryName

if ($nodePath) {
    $env:PATH = "$nodePath;" + $env:PATH
    Write-Host "✓ Node.js found at: $nodePath" -ForegroundColor Green
    
    # Mostrar versión de Node
    $nodeVersion = & node --version
    Write-Host "✓ Node version: $nodeVersion" -ForegroundColor Green
    Write-Host ""
    
    # Construir la aplicación
    Write-Host "Building application..." -ForegroundColor Yellow
    & .\node_modules\.bin\vite.cmd build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  ✓ Build completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. The production files are in the 'dist' folder" -ForegroundColor White
        Write-Host "2. Upload the contents of 'dist' to your A2 Hosting server" -ForegroundColor White
        Write-Host "3. Make sure to include the .htaccess file" -ForegroundColor White
        Write-Host ""
        
        # Crear archivo ZIP para facilitar la subida
        Write-Host "Creating ZIP file for easy upload..." -ForegroundColor Yellow
        if (Test-Path "epc-dist.zip") {
            Remove-Item "epc-dist.zip" -Force
        }
        Compress-Archive -Path "dist\*" -DestinationPath "epc-dist.zip" -Force
        Write-Host "✓ Created epc-dist.zip" -ForegroundColor Green
        Write-Host ""
        
        # Mostrar tamaño del build
        $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan
        
    }
    else {
        Write-Host ""
        Write-Host "✗ Build failed. Please check the errors above." -ForegroundColor Red
        exit 1
    }
    
}
else {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}
