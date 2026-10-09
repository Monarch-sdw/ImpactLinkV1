$runtimePath = Join-Path $PSScriptRoot '.runtime\processes.json'
if (-not (Test-Path -LiteralPath $runtimePath)) { Write-Output 'No saved local processes.'; exit }
$saved = Get-Content -LiteralPath $runtimePath -Raw | ConvertFrom-Json
if ($saved.root -and $saved.root -ne $PSScriptRoot) { throw 'The saved processes belong to a different project copy.' }
$pythonExe = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
$nextScript = Join-Path $PSScriptRoot 'frontend\node_modules\next\dist\bin\next'
foreach ($processId in @($saved.backend,$saved.frontend)) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    if ($processInfo -and (($processInfo.ExecutablePath -eq $pythonExe -and $processInfo.CommandLine -like '*uvicorn app.main:app*') -or $processInfo.CommandLine.Contains($nextScript))) {
        # Stop only the saved process and its direct children, after identity checks.
        Get-CimInstance Win32_Process -Filter "ParentProcessId=$processId" | ForEach-Object { Stop-Process -Id $_.ProcessId -ErrorAction SilentlyContinue }
        Stop-Process -Id $processId -ErrorAction SilentlyContinue
    }
}
Write-Output 'Stopped the saved ImpactLink processes.'
