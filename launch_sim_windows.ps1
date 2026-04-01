# VectorSense Windows Launch Script with VNC Support

Write-Host "[INIT] VectorSense Windows Launch Sequence" -ForegroundColor Cyan

# Kill existing processes
Get-Process | Where-Object {$_.Name -match "gz|python|node"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Set environment variables
$env:GZ_SIM_SYSTEM_PLUGIN_PATH = "d:\PROJECT\ROBOTICS\VECTORSENSE\vectorsense_ws\install\vectorsense_gazebo\lib\vectorsense_gazebo"

Write-Host "[GAZEBO] Launching Gazebo Simulation..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "ros2" -ArgumentList "launch", "vectorsense_gazebo", "vectorsense_full_demo.launch.py"
Start-Sleep -Seconds 15

Write-Host "[BRIDGE] Starting ZMQ-to-WebSocket Bridge..." -ForegroundColor Yellow
Start-Process -NoNewWindow python -ArgumentList "d:\PROJECT\ROBOTICS\VECTORSENSE\gazebo_to_vnc_bridge.py"
Start-Sleep -Seconds 2

Write-Host "[SCADA] Starting SCADA Network Simulator..." -ForegroundColor Magenta
Start-Process -NoNewWindow python -ArgumentList "d:\PROJECT\ROBOTICS\VECTORSENSE\scada_network_sim.py"
Start-Sleep -Seconds 2

Write-Host "[INTEL] Starting Physics Intelligence Bridge..." -ForegroundColor Blue
Start-Process -NoNewWindow python -ArgumentList "d:\PROJECT\ROBOTICS\VECTORSENSE\vectorsense_ws\src\vectorsense_intelligence\scripts\financial_physics_bridge.py"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VectorSense System ONLINE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Gazebo GUI: Check Gazebo window"
Write-Host "Dashboard: http://localhost:5173/"
Write-Host "WebSocket: ws://localhost:8001"
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Press Ctrl+C to stop all processes"
Wait-Event
