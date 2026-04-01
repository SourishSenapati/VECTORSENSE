#!/bin/bash
# High-Fidelity Intelligence Simulation Launch Script (MASTER)
# GZ Sim Harmonic + Refinery + Sovereign URDF + APF Controller + Cyber-Physical Truth Engine

# Clean up existing processes
killall -9 Xvfb x11vnc websockify gz sim gz-sim-server gz-sim-gui node python3 2>/dev/null || true
rm -f /tmp/.X100-lock /tmp/.X11-unix/X100 2>/dev/null || true

# Force software rendering for WSL/Headless stability
export LIBGL_ALWAYS_SOFTWARE=1
export MESA_GL_VERSION_OVERRIDE=4.5
export MESA_GLSL_VERSION_OVERRIDE=450

echo "Starting Xvfb (Virtual Frame Buffer)..."
Xvfb :99 -screen 0 1280x1024x24 -nolisten unix &
sleep 2

export DISPLAY=:99
unset WAYLAND_DISPLAY
echo "Starting x11vnc..."
x11vnc -display :99 -forever -nopw -listen 127.0.0.1 -rfbport 5905 &
sleep 2

echo "Starting websockify (NoVNC)..."
websockify --web /usr/share/novnc 6080 127.0.0.1:5905 &
sleep 2

echo "Loading Industrial Simulation Stack (ROS 2 Jazzy)..."
source /opt/ros/jazzy/setup.bash
source /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/install/setup.bash

# Set up GZ Sim Plugin Path
export GZ_SIM_SYSTEM_PLUGIN_PATH=/mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/install/vectorsense_gazebo/lib/vectorsense_gazebo

echo "[DEMO] Launching Master High-Fidelity Refinery World..."
ros2 launch vectorsense_gazebo vectorsense_full_demo.launch.py &
sleep 20

echo "[PINN] Initializing Pure TensorRT Inference Core..."
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/physics_engine_pinn.py &
sleep 3

echo "[INTEL] Activating Cyber-Physical Discrepancy Engine (Truth Bridge)..."
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_intelligence/scripts/financial_physics_bridge.py &
sleep 2

echo "[TRICKERY] Initializing Hacked SCADA Network Simulator..."
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/scada_network_sim.py &
sleep 2

echo "[PILOT] Initializing APF Autonomous Flight Brain..."
python3 /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_intelligence/scripts/apf_flight_controller.py &


echo "---------------------------------------------------------"
echo "VectorSense Cyber-Physical Demo is LIVE."
echo "Physical Reality: Port 5556 (Gazebo)"
echo "Digital Network:  Port 5557 (Compromised SCADA)"
echo "Truth Comparator: Port 8000 (WebSocket)"
echo "---------------------------------------------------------"
echo "Access NoVNC: http://localhost:6080/vnc.html"
echo "Access Dashboard: http://localhost:5173/"

# Keep script alive
wait
