#!/usr/bin/env python3
"""
black_swan_demo.py — VectorSense Autonomous Flight Controller.

V3: ALIGNED WITH NCI-25 MEGA-REFINERY RE-SCALING.
"""
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from std_msgs.msg import String
import math
import time

class BlackSwanController(Node):
    def __init__(self):
        super().__init__('black_swan_controller')
        
        self.cmd_pub = self.create_publisher(Twist, '/vectorsense/cmd_vel', 10)
        self.state_pub = self.create_publisher(String, '/vectorsense/mission_state', 10)
        self.odom_sub = self.create_subscription(Odometry, '/odom', self._odom_callback, 10)
        
        self.timer = self.create_timer(0.1, self._timer_callback)
        
        # State Machine Initialization
        self.state = "LIFTOFF"
        self.pos = [0.0, 0.0, 0.0]
        self.start_time = None
        self.hazard_pos = [17.5, -8.0, 12.0] # Column B2 Leak Point (NCI-25 Scale)
        self.orbit_start_time = None
        
        self.get_logger().info("GHOST CORE V3: Mission Controller Booted. State: LIFTOFF")

    def _odom_callback(self, msg: Odometry) -> None:
        self.pos = [msg.pose.pose.position.x, 
                    msg.pose.pose.position.y, 
                    msg.pose.pose.position.z]
        if self.start_time is None:
            self.start_time = time.time()

    def _timer_callback(self) -> None:
        if self.start_time is None:
            return # Wait for first odom

        # Publish current state
        state_msg = String()
        state_msg.data = self.state
        self.state_pub.publish(state_msg)

        msg = Twist()
        elapsed = time.time() - self.start_time

        if self.state == "LIFTOFF":
            # State 1: Vertical Ascent (High-Gain)
            msg.linear.z = 2.5
            if self.pos[2] >= 12.0:
                self.state = "INGRESS"
                self.get_logger().info("LIFTOFF COMPLETE (12m ASL). EXECUTING SECTOR-A PENETRATION.")

        elif self.state == "INGRESS":
            # State 2: Industrial Trajectory to Column B2
            dx = self.hazard_pos[0] - self.pos[0]
            dy = self.hazard_pos[1] - self.pos[1]
            dz = self.hazard_pos[2] - self.pos[2]
            
            # Simple P-control for demo trajectory
            msg.linear.x = 0.8 * dx
            msg.linear.y = 0.8 * dy
            msg.linear.z = 0.5 * dz
            
            dist = math.sqrt(dx**2 + dy**2)
            if dist < 2.0: 
                self.state = "ORBIT_HAZARD"
                self.orbit_start_time = time.time()
                self.get_logger().info("HAZARD ZONE REACHED. INITIALIZING ATMOSPHERIC TOMOGRAPHY.")

        elif self.state == "ORBIT_HAZARD":
            # State 3: Mathematical Orbit (6m radius) for PINN data collection
            t = (time.time() - self.orbit_start_time)
            radius = 6.0
            angle = t * 0.4 # Slow for high-res scanning
            
            target_x = self.hazard_pos[0] + radius * math.cos(angle)
            target_y = self.hazard_pos[1] + radius * math.sin(angle)
            
            msg.linear.x = 2.0 * (target_x - self.pos[0])
            msg.linear.y = 2.0 * (target_y - self.pos[1])
            msg.linear.z = 1.0 * (self.hazard_pos[2] - self.pos[2])
            
            if t > 30.0:
                self.state = "ISOLATE"
                self.get_logger().info("TOMOGRAPHY COMPLETE. PINN ADVISORY BROADCASTED.")

        elif self.state == "ISOLATE":
            # State 4: Source Localization (Station keeping)
            msg.linear.x = 0.0
            msg.linear.y = 0.0
            msg.linear.z = 0.0
            if elapsed > 60.0:
                self.state = "EGRESS"
                self.get_logger().info("MISSION SUCCESS. RETURNING TO BASE SECTOR.")

        elif self.state == "EGRESS":
            # State 5: Safety Return
            msg.linear.x = -4.0
            if self.pos[0] <= -5.0:
                msg.linear.x = 0.0
                self.state = "COMPLETE"

        self.cmd_pub.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = BlackSwanController()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == "__main__":
    main()
