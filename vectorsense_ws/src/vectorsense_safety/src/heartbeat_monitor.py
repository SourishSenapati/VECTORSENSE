import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import time

class VectorSenseSafetyWatchdog(Node):
    def __init__(self):
        super().__init__('vectorsense_safety_watchdog')
        
        # Subscribe to AI Heartbeat
        self.subscription = self.create_subscription(
            String,
            '/vectorsense/safety/heartbeat',
            self.heartbeat_callback,
            10)
            
        self.last_heartbeat_time = self.get_clock().now()
        
        # Safety Trigger Period (500ms Threshold)
        self.timer = self.create_timer(0.1, self.check_safety_threshold)
        
        self.get_logger().info("VectorSense Safety Watchdog Online. Monitoring Nervous System...")

    def heartbeat_callback(self, msg):
        self.last_heartbeat_time = self.get_clock().now()
        # Log for verbose debug
        # self.get_logger().debug(f"HEARTBEAT RECEIVED: {msg.data}")

    def check_safety_threshold(self):
        current_time = self.get_clock().now()
        diff = current_time - self.last_heartbeat_time
        
        # Threshold check: 500ms (Directive 3.2: 0.5s)
        if diff.nanoseconds > 500 * 1_000_000:
            self.get_logger().error("CRITICAL ERROR: AI HEARTBEAT LOST! ( > 500ms )")
            self.trigger_failsafe_override()

    def trigger_failsafe_override(self):
        self.get_logger().warn("TRIGGERING INDUSTRIAL OVERRIDE: MAVROS -> RTL (Return to Launch)")
        # In actual implementation, send MAVROS Command (FC_MODE -> RTL or SET_VELOCITY -> 0)
        # self.mavros_mode_client.call_async(mode_request)

def main(args=None):
    rclpy.init(args=args)
    node = VectorSenseSafetyWatchdog()
    
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
