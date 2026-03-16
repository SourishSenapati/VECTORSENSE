#!/usr/bin/env python3
"""
vectorsense_demo.launch.py

Brings up the full VectorSense simulation stack inside WSL:
  1. Gazebo Harmonic (headless or GUI) with the chemical plant world
  2. ros_gz_bridge: bridges Gazebo topics to ROS 2
  3. robot_state_publisher: publishes the high-fidelity URDF kinematic tree
  4. gazebo_zmq_bridge: serialises odometry → ZMQ PUB tcp://*:5555 → Windows
"""
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, ExecuteProcess
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description() -> LaunchDescription:
    pkg_description = get_package_share_directory("vectorsense_description")
    pkg_gazebo     = get_package_share_directory("vectorsense_gazebo")

    gui_arg = DeclareLaunchArgument(
        "gui",
        default_value="true",
        description="Launch Gazebo with GUI (false for headless CI)",
    )
    _ = LaunchConfiguration("gui")   # reserved for future headless flag

    urdf_path = os.path.join(
        pkg_description, "urdf", "drone_high_fidelity.urdf"
    )
    world_path = os.path.join(
        pkg_gazebo, "worlds", "chemical_plant.sdf"
    )

    with open(urdf_path, "r", encoding="utf-8") as fh:
        robot_description = fh.read()

    # ── 1. Gazebo Harmonic ────────────────────────────────────────────────────
    gz_sim = ExecuteProcess(
        cmd=[
            "gz", "sim",
            "-r",          # run immediately
            world_path,
            "--ros-args",
        ],
        output="screen",
    )

    # ── 2. ROS–Gazebo bridge for kinematics ───────────────────────────────────
    gz_bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="gz_ros_bridge",
        arguments=[
            "/model/vectorsense_drone/odometry@nav_msgs/msg/Odometry[gz.msgs.Odometry",
            "/tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V",
            "/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock",
        ],
        remappings=[
            ("/model/vectorsense_drone/odometry", "/odom"),
        ],
        output="screen",
    )

    # ── 3. Robot State Publisher ──────────────────────────────────────────────
    rsp = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        name="robot_state_publisher",
        parameters=[{"robot_description": robot_description, "use_sim_time": True}],
        output="screen",
    )

    # ── 4. Spawn drone in Gazebo world ────────────────────────────────────────
    spawn_drone = Node(
        package="ros_gz_sim",
        executable="create",
        name="spawn_vectorsense",
        arguments=[
            "-name", "vectorsense_drone",
            "-file", urdf_path,
            "-x", "12.5", "-y", "4.2", "-z", "1.0",
        ],
        output="screen",
    )

    # ── 5. ZMQ telemetry bridge (WSL → Windows) ───────────────────────────────
    zmq_bridge = Node(
        package="vectorsense_bridge",
        executable="gazebo_zmq_bridge",
        name="gazebo_zmq_bridge",
        output="screen",
    )

    return LaunchDescription([
        gui_arg,
        gz_sim,
        gz_bridge,
        rsp,
        spawn_drone,
        zmq_bridge,
    ])
