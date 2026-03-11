import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
import zmq
import json
import math
import numpy as np

class APFFlightController(Node):
    def __init__(self):
        super().__init__('apf_flight_controller')
        
        # ROS 2 Subscribers and Publishers
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        self.odom_sub = self.create_subscription(Odometry, '/odom', self.odom_callback, 10)
        
        # Mission Waypoint (Attractive Anchor)
        self.target = np.array([20.0, 5.0, 8.0])
        
        # Hazard Tracking (Repulsive Source)
        self.hazard_pos = np.array([5.0, 5.0, 8.0])
        self.hazard_active = False
        
        # ZeroMQ Listener for Gas Hazard
        self.ctx = zmq.Context()
        self.zmq_sock = self.ctx.socket(zmq.SUB)
        self.zmq_sock.connect("tcp://127.0.0.1:5556")
        self.zmq_sock.setsockopt_string(zmq.SUBSCRIBE, "")
        
        # Controller Parameters
        self.Ka = 0.5  # Attractive gain
        self.Kr = 15.0 # Repulsive gain
        self.d_safe = 4.0 # Safety radius (meters)
        
        # Internal State
        self.current_pos = np.array([0.0, 0.0, 0.0])
        self.create_timer(0.1, self.control_loop)
        self.create_timer(0.1, self.zmq_poll)

    def odom_callback(self, msg):
        p = msg.pose.pose.position
        self.current_pos = np.array([p.x, p.y, p.z])

    def zmq_poll(self):
        try:
            # Non-blocking poll for hazard updates
            msg = self.zmq_sock.recv_string(flags=zmq.NOBLOCK)
            data = json.loads(msg)
            self.hazard_active = data.get("leak", False)
            if self.hazard_active:
                self.hazard_pos = np.array(data.get("plume_origin", [5.0, 5.0, 8.0]))
        except zmq.Again:
            pass

    def control_loop(self):
        if self.current_pos is None:
            return

        # 1. Attractive Force (To Waypoint)
        # F_att = Ka * (target - current)
        f_att = self.Ka * (self.target - self.current_pos)

        # 2. Repulsive Force (From Hazard)
        f_rep = np.array([0.0, 0.0, 0.0])
        status = "Tracking Waypoint"

        if self.hazard_active:
            dist = np.linalg.norm(self.current_pos - self.hazard_pos)
            if dist < self.d_safe:
                status = "Evasive Maneuver - Orbiting Hazard"
                # F_rep = Kr * (1/dist - 1/d_safe)^2 * direction_away
                direction = (self.current_pos - self.hazard_pos) / (dist + 1e-6)
                magnitude = self.Kr * (1.0/dist - 1.0/self.d_safe)**2
                f_rep = magnitude * direction

        # 3. Vector Fusion
        cmd_vector = f_att + f_rep
        
        # Limit velocity for industrial safety
        max_vel = 2.0 # m/s
        v_norm = np.linalg.norm(cmd_vector)
        if v_norm > max_vel:
            cmd_vector = (cmd_vector / v_norm) * max_vel

        # Publish Twist
        twist = Twist()
        twist.linear.x = cmd_vector[0]
        twist.linear.y = cmd_vector[1]
        twist.linear.z = cmd_vector[2]
        self.cmd_pub.publish(twist)
        
        self.get_logger().info(f"APF STATUS: {status} | Pos: {self.current_pos}")

def main():
    rclpy.init()
    node = APFFlightController()
    rclpy.spin(node)
    rclpy.shutdown()

if __name__ == '__main__':
    main()
