#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
import numpy as np

class APFOrchestrator(Node):
    """
    Directive 4.1: Swarm Orchestration with Artificial Potential Field (APF).
    Orbits hazards if drift is within critical standoff distance.
    """
    def __init__(self):
        super().__init__('apf_orchestrator')
        
        # Hazard Location (From Gazebo World: Pipeline at 0 10 5)
        self.hazard_pos = np.array([0.0, 10.0, 5.0])
        self.standoff_dist = 5.0
        self.safety_gain = 2.0
        
        self.odom_sub = self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        self.get_logger().info("VectorSense APF Orchestrator: ACTIVE.")

    def odom_callback(self, msg):
        drone_pos = np.array([
            msg.pose.pose.position.x,
            msg.pose.pose.position.y,
            msg.pose.pose.position.z
        ])
        
        # Vector from hazard to drone
        vector_to_drone = drone_pos - self.hazard_pos
        dist = np.linalg.norm(vector_to_drone)
        
        if dist < self.standoff_dist:
            # Vector is repulsive (outward)
            repulsion = (vector_to_drone / dist) * (self.standoff_dist - dist) * self.safety_gain
            
            # Add tangential orbit vector (X-Y Plane)
            tangent = np.array([-vector_to_drone[1], vector_to_drone[0], 0.0])
            tangent = tangent / np.linalg.norm(tangent) * 0.5 # Orbit speed
            
            cmd = Twist()
            # Net APF control (sum of repulsive and orbits)
            cmd.linear.x = repulsion[0] + tangent[0]
            cmd.linear.y = repulsion[1] + tangent[1]
            cmd.linear.z = repulsion[2] # Z-Repulsion if descending too low
            
            self.cmd_pub.publish(cmd)
            self.get_logger().info(f"[BRAKE] Stand-off Breach Detected: Dist {dist:.2f}m. Forced Orbit Engaged.", throttle_duration_sec=1.0)

def main(args=None):
    rclpy.init(args=args)
    orchestrator = APFOrchestrator()
    rclpy.spin(orchestrator)
    orchestrator.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
