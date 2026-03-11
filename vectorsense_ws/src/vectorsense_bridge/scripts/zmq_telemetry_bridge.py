#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from geometry_msgs.msg import Twist
from cv_bridge import CvBridge
import zmq
import lz4.frame
import msgpack
import cv2
import time
import numpy as np

class ZMQTeleremetryBridge(Node):
    """
    Directive 3.1: IPC Bridge linking Gazebo to external AI via ZeroMQ.
    """
    def __init__(self):
        super().__init__('zmq_telemetry_bridge')
        self.bridge = CvBridge()
        
        # ZeroMQ Logic
        self.context = zmq.Context()
        
        # DEALER for telemetry upload (Asynchronous Outgoing)
        self.dealer = self.context.socket(zmq.DEALER)
        self.dealer.connect("tcp://127.0.0.1:5555")
        
        # SUB for command ingestion
        self.sub = self.context.socket(zmq.SUB)
        self.sub.connect("tcp://127.0.0.1:5556")
        self.sub.setsockopt_string(zmq.SUBSCRIBE, "") # Subscribe to all
        
        # ROS 2 Topics
        self.image_sub = self.create_subscription(
            Image, '/vectorsense/camera/image_raw', self.image_callback, 10
        )
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        
        # Polling Timer for ZMQ SUB
        self.timer = self.create_timer(0.01, self.poll_zmq) # 100Hz
        
        self.get_logger().info("VectorSense ZeroMQ Bridge: CONNECTED.")

    def image_callback(self, msg):
        """
        Directive 3.2: 60 FPS Visual Feed Serialization.
        Aggressive LZ4 Compression applied for low-latency transmission.
        """
        try:
            # ROS -> OpenCV
            cv_image = self.bridge.imgmsg_to_cv2(msg, "bgr8")
            
            # Metadata for the AI
            payload = {
                "drone_id": "VectorSense_1",
                "timestamp": msg.header.stamp.sec + msg.header.stamp.nanosec * 1e-9,
                "width": 1280,
                "height": 720,
                "data": cv_image.tobytes()
            }
            
            # Serialize + Compress
            packed = msgpack.packb(payload, use_bin_type=True)
            compressed = lz4.frame.compress(packed)
            
            # Async broadcast
            self.dealer.send(compressed)
            
        except Exception as e:
            self.get_logger().error(f"Image Compression Failure: {e}")

    def poll_zmq(self):
        """
        Ingests tracking coordinates and translates to flight commands.
        """
        try:
            # Non-blocking receive for command stream
            msg_bytes = self.sub.recv(flags=zmq.NOBLOCK)
            
            # Decompress + Unpack (Mirroring Base Station protocol)
            uncompressed = lz4.frame.decompress(msg_bytes)
            data = msgpack.unpackb(uncompressed, raw=False)
            
            # Process coordinates/offsets
            cmd = Twist()
            offsets = data.get("swarm_offset", [0.0, 0.0, 0.0])
            
            # Linear translation to velocity
            cmd.linear.x = float(offsets[0])
            cmd.linear.y = float(offsets[1])
            cmd.linear.z = float(offsets[2])
            
            self.cmd_pub.publish(cmd)
            
        except zmq.Again:
            pass # No data available
        except Exception as e:
            self.get_logger().error(f"ZMQ Command Ingestion Error: {e}")

def main(args=None):
    rclpy.init(args=args)
    bridge = ZMQTeleremetryBridge()
    rclpy.spin(bridge)
    bridge.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
