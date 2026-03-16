import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, Command
from launch_ros.actions import Node

def generate_launch_description():
    pkg_dir = get_package_share_directory('vectorsense_drone_sim')
    
    # Paths
    urdf_path = os.path.join(pkg_dir, 'urdf', 'vectorsense.urdf.xacro')
    world_path = os.path.join(pkg_dir, 'worlds', 'industrial_plant.sdf')
    rviz_config_path = os.path.join(pkg_dir, 'rviz', 'flight_config.rviz')

    # Xacro processing
    robot_description_content = Command(['xacro ', urdf_path])

    # Robot State Publisher
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{'robot_description': robot_description_content}]
    )

    # Gazebo Sim
    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([os.path.join(
            get_package_share_directory('ros_gz_sim'), 'launch', 'gz_sim.launch.py'
        )]),
        launch_arguments={'gz_args': f'-r {world_path}'}.items(),
    )

    # Spawn Robot
    spawn = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=['-name', 'vectorsense_drone', '-topic', 'robot_description', '-z', '1.0'],
        output='screen',
    )

    # Bridge (GZ -> ROS 2)
    bridge = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        arguments=[
            '/cmd_vel@geometry_msgs/msg/Twist@gz.msgs.Twist',
            '/odom@nav_msgs/msg/Odometry@gz.msgs.Odometry',
            '/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock',
            '/tf@tf2_msgs/msg/TFMessage[gz.msgs.Pose_V',
        ],
        output='screen',
    )

    # RViz
    rviz = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        arguments=['-d', rviz_config_path],
        output='screen'
    )

    # Takeoff script (Entry point from setup.py)
    takeoff = Node(
        package='vectorsense_drone_sim',
        executable='takeoff_hover',
        output='screen'
    )

    return LaunchDescription([
        gazebo,
        spawn,
        robot_state_publisher,
        bridge,
        rviz,
        takeoff
    ])
