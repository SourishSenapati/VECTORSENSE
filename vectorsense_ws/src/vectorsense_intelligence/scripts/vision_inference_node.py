import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge, CvBridgeError
import cv2
import torch
import numpy as np
import sys
import os

# Ensure the scripts directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import your PINN model from the file above
from vectorsense_pinn import VectorSensePINN

class VectorSenseInferenceNode(Node):
    def __init__(self):
        super().__init__('vectorsense_inference_node')
        
        # Subscribing to Gazebo's simulated camera topic
        self.subscription = self.create_subscription(
            Image,
            '/vectorsense/camera/image_raw',
            self.image_callback,
            10)
            
        # Publisher to broadcast the processed heatmap/tracking data back to RViz2
        self.publisher_ = self.create_publisher(Image, '/vectorsense/ai/concentration_map', 10)
        
        self.bridge = CvBridge()
        
        # Load the PyTorch PINN (Ensure it's loaded to the GPU)
        self.device = torch.device("cuda" if torch.cuda.get_available() else "cpu")
        self.model = VectorSensePINN().to(self.device)
        self.model.eval() # Set to evaluation mode for inference
        
        self.get_logger().info("VectorSense Inference Node Online. Awaiting visual telemetry...")

    def image_callback(self, msg):
        try:
            # 1. Convert ROS Image message to OpenCV Matrix (BGR 8-bit)
            cv_image = self.bridge.imgmsg_to_cv2(msg, 'bgr8')
            
            # 2. Preprocess: Convert to grayscale (simulating a thermal/gas gradient map)
            gray_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # 3. Transform OpenCV array to PyTorch Tensor
            # Normalize pixel values to [0, 1]
            tensor_image = torch.from_numpy(gray_image).float().to(self.device) / 255.0
            
            # --- PINN INFERENCE LOGIC HERE ---
            # In a live scenario, you extract the boundary conditions from 'tensor_image'
            # and pass them through self.model(). For this demo, we simulate processing time.
            with torch.no_grad():
                # Example dummy operation representing network throughput
                processed_tensor = tensor_image * 0.95 
            
            # 4. Post-Process: Convert PyTorch tensor back to OpenCV array
            output_array = (processed_tensor.cpu().numpy() * 255).astype(np.uint8)
            
            # Apply a colormap for visual impact during your demo (Jet colormap looks like thermal data)
            heatmap = cv2.applyColorMap(output_array, cv2.COLORMAP_JET)
            
            # 5. Publish the processed image back to ROS 2
            output_msg = self.bridge.cv2_to_imgmsg(heatmap, 'bgr8')
            self.publisher_.publish(output_msg)
            
        except CvBridgeError as e:
            self.get_logger().error(f"CV Bridge Error: {e}")

def main(args=None):
    rclpy.init(args=args)
    node = VectorSenseInferenceNode()
    
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
