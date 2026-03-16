#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
import time

class TakeoffHover(Node):
    def __init__(self):
        super().__init__('takeoff_hover')
        self.publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        self.subscription = self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        self.timer = self.create_timer(0.1, self.control_loop)
        
        self.current_z = 0.0
        self.target_z = 5.0
        self.takeoff_started = False
        self.get_logger().info('Takeoff & Hover Node Started. Waiting for Odom...')

    def odom_callback(self, msg):
        self.current_z = msg.pose.pose.position.z
        if not self.takeoff_started:
            self.get_logger().info(f'Odom live. Starting takeoff to {self.target_z}m...')
            self.takeoff_started = True

    def control_loop(self):
        if not self.takeoff_started:
            return

        msg = Twist()
        error = self.target_z - self.current_z
        
        # Simple P control for altitude
        if error > 0.1:
            msg.linear.z = 1.0 # Lift off
        elif error < -0.1:
            msg.linear.z = -0.5 # Descend slowly
        else:
            msg.linear.z = 0.0 # Hover
            self.get_logger().info('Target altitude reached. Holding hover.', once=True)

        self.publisher.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = TakeoffHover()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
