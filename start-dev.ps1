$nodePath = (Get-ChildItem "C:\Users\Administrator\AppData\Local\ms-playwright-go" -Recurse -Filter "node.exe" -ErrorAction SilentlyContinue | Select-Object -First 1).DirectoryName
if ($nodePath) {
    $env:PATH = "$nodePath;" + $env:PATH
    Write-Host "Node.js found at: $nodePath"
    node --version
    Write-Host "Starting Vite development server..."
    & .\node_modules\.bin\vite.cmd
} else {
    Write-Host "Node.js not found. Please install Node.js first."
    exit 1
}
