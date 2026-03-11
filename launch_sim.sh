#!/bin/bash
# High-Fidelity Industrial Simulation Launch Script (MASTER)
# GZ Sim Harmonic + Refinery + Sovereign URDF + APF Controller

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

echo "Loading Industrial Simulation Stack (ROS 2 Jazzy)..."
source /opt/ros/jazzy/setup.bash
source /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/install/setup.bash

# Set up GZ Sim Plugin Path for the custom GasLeakPlugin
export GZ_SIM_SYSTEM_PLUGIN_PATH=/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/install/vectorsense_gazebo/lib/vectorsense_gazebo

echo "Launching Master Full Demo..."
ros2 launch vectorsense_gazebo vectorsense_full_demo.launch.py &
sleep 20

echo "Initializing APF Autonomous Flight Brain..."
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_intelligence/scripts/apf_flight_controller.py &
sleep 2

echo "Initializing Spatial Twin Data Bridge..."
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_intelligence/scripts/spatial_twin_bridge.py &

echo "Full Simulation Stack is LIVE."
echo "Access NoVNC: http://localhost:6080/vnc.html"
echo "Access Dashboard: http://localhost:5173/"

# Keep script alive
wait
