import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, ExecuteProcess
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node

def generate_launch_description():
    pkg_description = get_package_share_directory('vectorsense_description')
    pkg_gazebo = get_package_share_directory('vectorsense_gazebo')
    pkg_bridge = get_package_share_directory('vectorsense_bridge')
    
    world_file = os.path.join(pkg_gazebo, 'worlds', 'chemical_plant_hazard.world')
    urdf_file = os.path.join(pkg_description, 'urdf', 'vectorsense.urdf')
    
    # 1. Gazebo Harmonic World
    gazebo = ExecuteProcess(
        cmd=['gz', 'sim', '-r', world_file],
        output='screen'
    )
    
    # 2. Robot State Publisher
    with open(urdf_file, 'r') as infp:
        robot_desc = infp.read()
    
    rsp = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        output='screen',
        parameters=[{'robot_description': robot_desc}]
    )
    
    # 3. Spawn Drone in Gazebo
    spawn_drone = Node(
        package='ros_gz_sim',
        executable='create',
        output='screen',
        arguments=['-name', 'vectorsense', '-topic', 'robot_description', '-z', '1.0']
    )
    
    # 4. ZeroMQ Bridge
    zmq_bridge = Node(
        package='vectorsense_bridge',
        executable='zmq_telemetry_bridge.py',
        output='screen'
    )
    
    # 5. APF Orchestrator
    apf_orc = Node(
        package='vectorsense_bridge',
        executable='apf_orchestrator.py',
        output='screen'
    )
    
    return LaunchDescription([
        gazebo,
        rsp,
        spawn_drone,
        zmq_bridge,
        apf_orc
    ])
