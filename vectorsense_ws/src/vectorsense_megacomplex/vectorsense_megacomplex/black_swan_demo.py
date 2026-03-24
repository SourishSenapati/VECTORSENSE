#!/usr/bin/env python3
"""
black_swan_demo.py — VectorSense Autonomous Flight Controller.

Implements AGENTIC PROMPT 4: The Autonomous Flight Demo Script.
A rigid industrial state machine for the NCI-25 Mega-Refinery inspection.
States: LIFTOFF, INGRESS, ORBIT_HAZARD, ISOLATE, EGRESS.
"""
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
import math
import time

class BlackSwanController(Node):
    def __init__(self):
        super().__init__('black_swan_controller')
        
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.odom_sub = self.create_subscription(Odometry, '/odom', self._odom_cb, 10)
        
        self.timer = self.create_timer(0.1, self.control_loop)
        
        # State Machine
        self.state = "LIFTOFF"
        self.pos = [0.0, 0.0, 0.0]
        self.yaw = 0.0
        self.start_time = time.time()
        
        self.get_logger().info("Black Swan Autonomous Controller Initialized. State: LIFTOFF")

    def _odom_cb(self, msg):
        self.pos = [msg.pose.pose.position.x, msg.pose.pose.position.y, msg.pose.pose.position.z]
        # Simplified yaw extraction
        q = msg.pose.pose.orientation
        siny_cosp = 2 * (q.w * q.z + q.x * q.y)
        cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z)
        self.yaw = math.atan2(siny_cosp, cosy_cosp)

    def control_loop(self):
        msg = Twist()
        elapsed = time.time() - self.start_time

        if self.state == "LIFTOFF":
            # State 1: Vertical Punch out to clear infrastructure
            msg.linear.z = 2.0
            if self.pos[2] >= 8.0:
                self.state = "INGRESS"
                self.get_logger().info("Target Altitude Reached. State: INGRESS")

        elif self.state == "INGRESS":
            # State 2: High-speed penetration into distillation sector
            msg.linear.x = 4.0
            msg.linear.z = 0.0
            # Condition: Travel 20 meters forward or time check
            if self.pos[0] >= 10.0: 
                self.state = "ORBIT_HAZARD"
                self.orbit_start_time = time.time()
                self.get_logger().info("Hazard Zone Detected. Initiating ORBIT_HAZARD")

        elif self.state == "ORBIT_HAZARD":
            # State 3: Mathematical Orbit (5m radius)
            # We use a combination of forward velocity and yaw rate: v = omega * r
            radius = 5.0
            v_forward = 1.5
            omega = v_forward / radius
            
            msg.linear.x = v_forward
            msg.angular.z = omega
            
            # Orbit for 15 seconds
            if time.time() - self.orbit_start_time > 15.0:
                self.state = "ISOLATE"
                self.get_logger().info("Inspection Complete. State: ISOLATE")

        elif self.state == "ISOLATE":
            # State 4: Stationary high-fidelity tomography scan
            msg.linear.x = 0.0
            msg.angular.z = 0.0
            if elapsed > 40.0: # Total mission time
                self.state = "EGRESS"
                self.get_logger().info("Mission Success. State: EGRESS")

        elif self.state == "EGRESS":
            # State 5: Return to safe sector
            msg.linear.x = -3.0
            if self.pos[0] <= -5.0:
                msg.linear.x = 0.0
                self.get_logger().info("Safe Sector Reached. Holding Station.")

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
