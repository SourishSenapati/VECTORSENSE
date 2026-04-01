# Master Reboot Script for VectorSense Ghost Core V3

# 1. Terminate All Processes
taskkill /F /IM python.exe /T
taskkill /F /IM python3.13.exe /T
wsl bash -c "pkill -f gz; pkill -f black_swan; pkill -f gazebo_zmq; pkill -f websockify"

# 2. Start Windows Intelligence Stack
Start-Process -NoNewWindow -FilePath "C:\Python313\python.exe" -ArgumentList "d:\PROJECT\ROBOTICS\VECTORSENSE\scada_network_sim.py"
Start-Process -NoNewWindow -FilePath "C:\Python313\python.exe" -ArgumentList "d:\PROJECT\ROBOTICS\VECTORSENSE\physics_engine_pinn.py"
Start-Process -NoNewWindow -FilePath "C:\Python313\python.exe" -ArgumentList "d:\PROJECT\ROBOTICS\VECTORSENSE\vectorsense_ws\src\vectorsense_intelligence\scripts\financial_physics_bridge.py"

# 3. Start WSL Physics Stack
wsl bash -c "source /opt/ros/jazzy/setup.bash; source /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/install/setup.bash; gz sim -s -r /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_megacomplex/worlds/jamnagar_emulation.sdf & sleep 5; ros2 run ros_gz_bridge parameter_bridge /vectorsense/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist /model/vectorsense_drone/odometry@nav_msgs/msg/Odometry[gz.msgs.Odometry /clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock /tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V /vectorsense/mission_state@std_msgs/msg/String[gz.msgs.StringMsg & sleep 5; ros2 run vectorsense_bridge gazebo_zmq_bridge & sleep 5; ros2 run vectorsense_megacomplex black_swan_demo"

Write-Host "VECTORSENSE GHOST CORE V3 REBOOTED. MISSION ACTIVE."
