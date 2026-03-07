import cv2
import numpy as np
import torch
import time

"""
VectorSense CUDA-Accelerated Optical Flow Executive.
Utilizes the Farneback algorithm for dense optical flow extraction from 
thermal industrial telemetry. Designed for high-speed velocity field estimation 
of turbulent plumes.
"""

class ThermalFlowAnalyzer:
    def __init__(self, width=640, height=480):
        self.width = width
        self.height = height
        
        # Check for CUDA availability in OpenCV
        self.cuda_available = cv2.cuda.getCudaEnabledDeviceCount() > 0
        if self.cuda_available:
            print("[HW] OpenCV CUDA Backend Detected. Initiating GpuMat pipelines.")
            self.gpu_prev = cv2.cuda_GpuMat()
            self.gpu_curr = cv2.cuda_GpuMat()
        else:
            print("[WARN] OpenCV CUDA NOT available. Falling back to AVX2/CPU optimization.")
            
        self.prev_gray = None

    def process_frame(self, frame):
        """
        Extract velocity vectors (u, v) from the current frame.
        """
        start_ts = time.perf_counter()
        
        # Pre-processing: Resizing and Grayscale conversion
        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        frame_gray = cv2.resize(frame_gray, (self.width, self.height))
        
        if self.prev_gray is None:
            self.prev_gray = frame_gray
            return None, 0.0

        if self.cuda_available:
            # Transfer to GPU Memory
            self.gpu_prev.upload(self.prev_gray)
            self.gpu_curr.upload(frame_gray)
            
            # CUDA Farneback Dense Optical Flow
            # Parameters: (pyr_scale, levels, winsize, iterations, poly_n, poly_sigma, flags)
            flow_obj = cv2.cuda.FarnebackOpticalFlow_create(5, 0.5, False, 15, 3, 5, 1.2, 0)
            gpu_flow = flow_obj.calc(self.gpu_prev, self.gpu_curr, None)
            
            # Download result
            flow = gpu_flow.download()
        else:
            # CPU Fallback (Multi-threaded OpenCV implementation)
            flow = cv2.calcOpticalFlowFarneback(self.prev_gray, frame_gray, None, 
                                                0.5, 3, 15, 3, 5, 1.2, 0)

        self.prev_gray = frame_gray
        
        # Extract u (x-velocity) and v (y-velocity)
        u_vectors = flow[..., 0]
        v_vectors = flow[..., 1]
        
        end_ts = time.perf_counter()
        latency_ms = (end_ts - start_ts) * 1000.0
        
        return (u_vectors, v_vectors), latency_ms

def simulate_flow_extraction():
    """
    Validation routine for thermal flow processing.
    """
    analyzer = ThermalFlowAnalyzer(width=320, height=240)
    
    # Simulate 30 frames of turbulent plume data
    for i in range(30):
        # Synthetic noise frame
        frame = (np.random.rand(480, 640, 3) * 255).astype(np.uint8)
        
        vectors, latency = analyzer.process_frame(frame)
        if vectors:
            u, v = vectors
            mag = np.mean(np.sqrt(u**2 + v**2))
            print(f"Frame {i:02d} | Mean Flow Intensity: {mag:.4f} | Latency: {latency:.2f} ms")
        
        time.sleep(0.033) # 30 FPS targeting

if __name__ == "__main__":
    simulate_flow_extraction()
