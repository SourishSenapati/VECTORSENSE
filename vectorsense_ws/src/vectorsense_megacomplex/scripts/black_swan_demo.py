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
        
        # State Machine
        self.state = "LIFTOFF"
        self.pos = [0.0, 0.0, 0.0]
        self.start_time = time.time()
        self.hazard_pos = [17.5, -8.0, 12.0] # Column B2 Leak Point
        self.orbit_start_time = None
        self.inspection_complete = False
        
        self.get_logger().info("Black Swan Autonomous Controller Initialized. State: LIFTOFF")

    def _odom_callback(self, msg: Odometry) -> None:
        self.pos = [msg.pose.pose.position.x, 
                    msg.pose.pose.position.y, 
                    msg.pose.pose.position.z]

    def _timer_callback(self) -> None:
        # Publish current state
        state_msg = String()
        state_msg.data = self.state
        self.state_pub.publish(state_msg)

        msg = Twist()
        elapsed = time.time() - self.start_time

        if self.state == "LIFTOFF":
            # State 1: Vertical Ascent (Autonomous Initialization)
            msg.linear.z = 2.0
            if self.pos[2] >= 10.0:
                self.state = "INGRESS"
                self.get_logger().info("LIFTOFF COMPLETE. SEARCHING FOR GHOST_VECTORS...")

        elif self.state == "INGRESS":
            # State 2: High-speed penetration to hazard zone
            dx = self.hazard_pos[0] - self.pos[0]
            dy = self.hazard_pos[1] - self.pos[1]
            dz = self.hazard_pos[2] - self.pos[2]
            
            msg.linear.x = 0.5 * dx
            msg.linear.y = 0.5 * dy
            msg.linear.z = 0.5 * dz
            
            # Condition: Travel to target
            dist = math.sqrt(dx**2 + dy**2)
            if dist < 2.0: 
                self.state = "ORBIT_HAZARD"
                self.orbit_start_time = time.time()
                self.get_logger().info("HAZARD ZONE REACHED. PINN SCANNING...")

        elif self.state == "ORBIT_HAZARD":
            # State 3: Mathematical Orbit (5m radius) around leak source
            t = (time.time() - self.orbit_start_time)
            radius = 5.0
            angle = t * 0.5 # 0.5 rad/s
            
            target_x = self.hazard_pos[0] + radius * math.cos(angle)
            target_y = self.hazard_pos[1] + radius * math.sin(angle)
            
            msg.linear.x = 2.0 * (target_x - self.pos[0])
            msg.linear.y = 2.0 * (target_y - self.pos[1])
            msg.linear.z = 1.0 * (self.hazard_pos[2] - self.pos[2])
            
            # Condition: Complete 2 Full Orbits (approx 25s)
            if t > 25.0:
                self.state = "ISOLATE"
                self.get_logger().info("PINN ANALYSIS COMPLETE. LETHAL PLUME ISOLATED.")

        elif self.state == "ISOLATE":
            # State 4: Precision Mitigation Maneuver (Wait for SCADA Lock)
            msg.linear.x = 0.0
            msg.linear.y = 0.0
            msg.linear.z = 0.0
            self.inspection_complete = True
            self.get_logger().info("STATIONARY MONITORING: SOURCE IDENTIFIED AS Pressurized Methane.")
            # The original EGRESS state is now appended, assuming it should follow ISOLATE
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
