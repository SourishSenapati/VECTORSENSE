#!/bin/bash
source /opt/ros/jazzy/setup.bash
source /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/install/setup.bash

export DISPLAY=:0
pkill -f gz
pkill -f black_swan
pkill -f gazebo_zmq

# Start Gazebo Server
gz sim -s -r /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_megacomplex/worlds/jamnagar_emulation.sdf &
sleep 5

# Publish Robot Description
ros2 run robot_state_publisher robot_state_publisher /mnt/d/PROJECT/ROBOTICS/VECTORSENSE/vectorsense_ws/src/vectorsense_megacomplex/urdf/vectorsense_ghost.urdf.xacro &
sleep 5

# Spawn Drone
ros2 run ros_gz_sim create -name vectorsense_drone -topic robot_description -x -10.0 -y 0.0 -z 0.5 &
sleep 5

# Start Bridge (Gazebo -> ROS)
ros2 run ros_gz_bridge parameter_bridge /vectorsense/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist /model/vectorsense_drone/odometry@nav_msgs/msg/Odometry[gz.msgs.Odometry /clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock /tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V /vectorsense/mission_state@std_msgs/msg/String[gz.msgs.StringMsg &
sleep 2

# Start ZMQ Bridge (WSL -> Windows)
ros2 run vectorsense_bridge gazebo_zmq_bridge &
sleep 2

# Start Mission Controller
ros2 run vectorsense_megacomplex black_swan_demo &

echo "ALL SYSTEMS NOMINAL. GHOST CORE V3 IS AIRBORNE."
wait
