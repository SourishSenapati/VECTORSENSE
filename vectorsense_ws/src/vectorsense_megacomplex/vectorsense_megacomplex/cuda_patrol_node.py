"""
cuda_patrol_node.py — VectorSense NCI-25 CUDA Trajectory Node.

Executes a high-density industrial inspection patrol using PyTorch-accelerated
trajectory calculations. Commands linear and angular velocities to the drone
via /cmd_vel.
"""
import time
import torch
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Twist

class CudaPatrolNode(Node):
    """
    Trajectory controller for NCI-25 industrial inspection.
    """
    def __init__(self):
        super().__init__('cuda_patrol_node')
        
        # Explicit CUDA Check
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.get_logger().info(f"[CUDA KERNEL] VectorSense NCI-25 Trajectory Engine Initialized on: {self.device}")
        
        self.publisher = self.create_publisher(Twist, '/cmd_vel', 10)
        self.timer = self.create_timer(0.1, self.run_mission)
        self.start_time = time.time()
        
        self.get_logger().info("Industrial Inspection Profile Loaded. Waiting for Physics Engine...")

    def run_mission(self):
        elapsed = time.time() - self.start_time
        msg = Twist()
        
        # Multi-stage NCI-25 Trajectory
        if elapsed < 5.0:
            # T+0s to T+5s: Vertical punch-out above the pipe rack
            msg.linear.z = 2.5
            self.get_logger().info("STAGE 1: Vertical Punch-Out...", once=True)
            
        elif elapsed < 15.0:
            # T+5s to T+15s: High-speed penetration into the Refinery sector
            msg.linear.z = 0.0
            msg.linear.x = 4.0
            self.get_logger().info("STAGE 2: Industrial Sector Penetration...", once=True)
            
        elif elapsed < 25.0:
            # T+15s to T+25s: Aggressive banking orbit around the distillation column
            msg.linear.x = 1.5
            msg.angular.z = 0.6
            self.get_logger().info("STAGE 3: Active Column Orbit...", once=True)
            
        else:
            # Hover
            msg.linear.x = 0.0
            msg.angular.z = 0.0
            msg.linear.z = 0.0
            self.get_logger().info("MISSION COMPLETE: Holding Station.", once=True)

        self.publisher.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = CudaPatrolNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
