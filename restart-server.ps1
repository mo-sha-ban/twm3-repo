# Restart the Node server
$nodeProcess = Get-Process | Where-Object {$_.ProcessName -eq "node"}
if ($nodeProcess) {
    Stop-Process -Id $nodeProcess.Id -Force
    Start-Sleep -Seconds 2
}

# Start the server
& node "d:\TWM3\twm3-backend\server.js"
