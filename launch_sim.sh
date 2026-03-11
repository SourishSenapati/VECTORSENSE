#!/bin/bash
# High-Fidelity Infrastructure Launch Script (VectorSense)
# GZ Sim Harmonic + Refinery + Sovereign URDF

# Clean up existing processes
killall -9 Xvfb x11vnc websockify gz sim gz-sim-server gz-sim-gui node python3 2>/dev/null || true

echo "Starting Xvfb (Virtual Frame Buffer)..."
Xvfb :100 -screen 0 1280x1024x24 &
sleep 2

export DISPLAY=:100
echo "Starting x11vnc..."
x11vnc -display :100 -forever -nopw -listen localhost &
sleep 2

echo "Starting websockify (NoVNC)..."
websockify --web /usr/share/novnc 6080 localhost:5900 &
sleep 2

echo "Starting Gazebo Sim (Harmonic) with Industrial Refinery..."
# Set up GZ Sim Plugin Path
export GZ_SIM_SYSTEM_PLUGIN_PATH=/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_gazebo/build
# Start the simulation with the industrial world
gz sim -v 4 -g /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/chemical_plant.world &
sleep 15

echo "Spawning Sovereign URDF Drone..."
# Use joint_state_publisher and robot_state_publisher for the high-fidelity URDF
# In a real setup, we would run: 
# ros2 launch vectorsense_description vectorsense_demo.launch.py
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_intelligence/scripts/spatial_twin_bridge.py &

echo "Infrastructure Live. Monitoring industrial hazards."
# Keep script alive
wait
