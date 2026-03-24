"""
nci25_demo.launch.py — VectorSense NCI-25 Orchestrator.

Launches Gazebo Harmonic with the Jamnagar Emulation world, spawns the Ghost
Core drone, and initiates the CUDA-accelerated inspection patrol.
"""
import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue

def generate_launch_description():
    """
    Generate launch description for the NCI-25 mega-refinery simulation.
    """
    # Package Paths
    pkg_megacomplex = get_package_share_directory('vectorsense_megacomplex')
    pkg_bridge = get_package_share_directory('vectorsense_bridge')
    pkg_ros_gz_sim = get_package_share_directory('ros_gz_sim')

    # Files
    urdf_path = os.path.join(pkg_megacomplex, 'urdf', 'vectorsense_ghost.urdf.xacro')
    world_path = os.path.join(pkg_megacomplex, 'worlds', 'jamnagar_emulation.sdf')

    # Robot Description
    robot_description_content = Command(['xacro ', urdf_path])

    # Gazebo Sim
    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, 'launch', 'gz_sim.launch.py')
        ),
        launch_arguments={'gz_args': f'-r {world_path}'}.items(),
    )

    # Robot State Publisher
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        output='screen',
        parameters=[{
            'robot_description': ParameterValue(robot_description_content, value_type=str),
            'use_sim_time': True
        }]
    )

    # Spawn Drone
    spawn = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-name', 'vectorsense_drone',
            '-topic', 'robot_description',
            '-x', '-10.0',
            '-y', '0.0',
            '-z', '0.5'
        ],
        output='screen',
    )

    # Bridge (Gazebo <-> ROS 2)
    bridge = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        arguments=[
            '/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist',
            '/model/vectorsense_drone/odometry@nav_msgs/msg/Odometry[gz.msgs.Odometry',
            '/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock',
            '/tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V',
        ],
        remappings=[
            ('/model/vectorsense_drone/odometry', '/odom'),
        ],
        output='screen',
    )

    # ZMQ Telemetry Bridge (WSL -> Windows)
    zmq_bridge = Node(
        package='vectorsense_bridge',
        executable='gazebo_zmq_bridge',
        name='gazebo_zmq_bridge',
        output='screen'
    )

    # CUDA Controller
    cuda_controller = Node(
        package='vectorsense_megacomplex',
        executable='cuda_patrol_node',
        output='screen'
    )

    return LaunchDescription([
        gazebo,
        robot_state_publisher,
        spawn,
        bridge,
        zmq_bridge,
        cuda_controller
    ])
