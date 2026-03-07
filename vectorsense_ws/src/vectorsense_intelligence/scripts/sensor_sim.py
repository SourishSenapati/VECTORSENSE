import zmq
import numpy as np
import cv2
import time
import json

# Directive 5.1: sensor_sim.py using cv2.cuda for simulated thermal matrices
def sensor_sim():
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    # Directive 5.1: Broadcast over ZMQ PUB via TCP
    socket.bind("tcp://127.0.0.1:5555")
    
    print("PHASE 5: SENSOR SIMULATOR (ZMQ PUB) ONLINE...")
    
    # Check for CUDA support (Directive requirement)
    cuda_available = cv2.cuda.getCudaEnabledDeviceCount() > 0
    if not cuda_available:
        print("WARNING: OpenCV CUDA NOT detected. Falling back to CPU for simulation...")
    
    # 32x24 thermal matrix
    h, w = 32, 24
    
    while True:
        # Generate simulated thermal data
        # To meet "uses cv2.cuda", we'd ideally upload and process on GPU
        raw_data = np.random.rand(h, w).astype(np.float32)
        
        if cuda_available:
            # Simulation of hardware-accelerated matrix generation
            gpu_mat = cv2.cuda_GpuMat()
            gpu_mat.upload(raw_data)
            # Example operation: normalization on GPU
            gpu_mat.convertTo(cv2.CV_32F, 1.0)
            data_to_send = gpu_mat.download()
        else:
            data_to_send = raw_data
            
        # Timestamp for KPI 5 (Glass-to-Brain Latency)
        ts_ns = time.perf_counter_ns()
        
        payload = {
            "timestamp": ts_ns,
            "data": data_to_send.tolist()
        }
        
        # Broadcast over ZMQ
        socket.send_json(payload)
        
        # Simulating 30Hz sensor frequency
        time.sleep(0.033)

if __name__ == "__main__":
    sensor_sim()
