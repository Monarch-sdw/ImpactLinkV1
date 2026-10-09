param(
    [switch]$Setup,
    [ValidateRange(1024,65535)][int]$FrontendPort = 3017,
    [ValidateRange(1024,65535)][int]$BackendPort = 8017
)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$pythonExe = Join-Path $projectRoot '.venv\Scripts\python.exe'
if ($FrontendPort -eq $BackendPort) { throw 'Frontend and backend ports must be different.' }
if ($Setup) {
    if (-not (Test-Path -LiteralPath $pythonExe)) { python -m venv (Join-Path $projectRoot '.venv') }
    & $pythonExe -m pip install -r (Join-Path $projectRoot 'backend\requirements.txt')
    if ($LASTEXITCODE -ne 0) { throw 'Backend dependency installation failed.' }
    Push-Location (Join-Path $projectRoot 'frontend')
    try { npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' } } finally { Pop-Location }
}
if (-not (Test-Path -LiteralPath $pythonExe)) { throw 'Run .\start-local.ps1 -Setup first. Python 3.12+ and Node.js 20.9+ must be on PATH.' }
$env:DEMO_MODE = 'true'
$env:CORS_ORIGINS = "http://localhost:$FrontendPort,http://127.0.0.1:$FrontendPort"
$env:API_URL = "http://127.0.0.1:$BackendPort"
$runtimeDir = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
$envPath = Join-Path $projectRoot 'backend\.env'
if (-not (Test-Path -LiteralPath $envPath)) {
    $randomBytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($randomBytes)
    $rng.Dispose()
    $secret = [Convert]::ToBase64String($randomBytes)
    Set-Content -LiteralPath $envPath -Value "JWT_SECRET=$secret`nDATABASE_URL=sqlite:///./impactlink.db" -Encoding ascii
}
foreach ($port in @($FrontendPort,$BackendPort)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { throw "Port $port is already in use. The app may already be running." }
}
Push-Location (Join-Path $projectRoot 'backend')
try {
    & $pythonExe -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed.' }
    & $pythonExe -m app.seed
    if ($LASTEXITCODE -ne 0) { throw 'Demo seeding failed.' }
} finally { Pop-Location }
$backendProcess = Start-Process -FilePath $pythonExe -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port',"$BackendPort" -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'backend.log') -RedirectStandardError (Join-Path $runtimeDir 'backend-error.log')
$nodeExe = (Get-Command node.exe).Source
$nextScript = Join-Path $projectRoot 'frontend\node_modules\next\dist\bin\next'
$frontendProcess = Start-Process -FilePath $nodeExe -ArgumentList "`"$nextScript`" dev --hostname 127.0.0.1 --port $FrontendPort" -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend-error.log')
@{backend=$backendProcess.Id;frontend=$frontendProcess.Id;frontendPort=$FrontendPort;backendPort=$BackendPort;root=$projectRoot;started=(Get-Date).ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeDir 'processes.json')
Write-Output "ImpactLink is starting: http://localhost:$FrontendPort"
Write-Output "API documentation: http://localhost:$BackendPort/docs"
Write-Output 'Use stop-local.ps1 to stop these project processes.'
