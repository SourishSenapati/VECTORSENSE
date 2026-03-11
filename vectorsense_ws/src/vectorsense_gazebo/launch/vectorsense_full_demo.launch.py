import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, SetEnvironmentVariable
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

def generate_launch_description():
    # Directive 1.1: Master Simulation Infrastructure
    pkg_vectorsense_gazebo = get_package_share_directory('vectorsense_gazebo')
    pkg_vectorsense_description = get_package_share_directory('vectorsense_description')
    pkg_ros_gz_sim = get_package_share_directory('ros_gz_sim')

    # Path to high-fidelity URDF
    urdf_file = os.path.join(pkg_vectorsense_description, 'urdf', 'drone_high_fidelity.urdf')
    with open(urdf_file, 'r') as infp:
        robot_desc = infp.read()

    # World configuration
    world_file = os.path.join(pkg_vectorsense_gazebo, 'worlds', 'refinery_hazard.sdf')

    # 1. Start Gazebo Sim with Industrial Refinery
    gz_sim = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, 'launch', 'gz_sim.launch.py')
        ),
        launch_arguments={'gz_args': f'-r {world_file}'}.items(),
    )

    # 2. Robot State Publisher (Publish URDF to /robot_description)
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        parameters=[{'robot_description': robot_desc}]
    )

    # 3. Spawn Drone into Refinery Tarmac
    spawn_drone = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-name', 'vectorsense_drone',
            '-topic', 'robot_description',
            '-x', '-15.0',
            '-y', '5.0',
            '-z', '0.5'
        ],
        output='screen',
    )

    # 4. ROS-GZ Bridge (Twist and Odom)
    # Bridge configuration for command velocity and odometry
    gz_bridge = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        arguments=[
            '/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist',
            '/odom@nav_msgs/msg/Odometry@gz.msgs.Odometry',
            '/world/refinery_hazard/model/vectorsense_drone/joint_state@sensor_msgs/msg/JointState@gz.msgs.Model',
            '/tf@tf2_msgs/msg/TFMessage@gz.msgs.Pose_V'
        ],
        output='screen'
    )

    return LaunchDescription([
        SetEnvironmentVariable(name='GZ_SIM_SYSTEM_PLUGIN_PATH', 
                               value=os.path.join(pkg_vectorsense_gazebo, '../../install/vectorsense_gazebo/lib/vectorsense_gazebo')),
        gz_sim,
        robot_state_publisher,
        spawn_drone,
        gz_bridge
    ])
