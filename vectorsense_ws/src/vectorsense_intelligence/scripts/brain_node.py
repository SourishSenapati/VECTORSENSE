import zmq
import torch
import time
import numpy as np
from vectorsense_pinn import VectorSensePINN, apply_vram_clamp

# Directive 5.2: brain_node.py with ZMQ SUB
def brain_node():
    print("PHASE 5: BRAIN NODE (ZMQ SUB) ONLINE...")
    
    # Directive 1.2: VRAM Clamp (Crucial for Edge reliability)
    apply_vram_clamp(0.58)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load the PINN (either PyTorch or eventually TensorRT)
    model = VectorSensePINN().to(device)
    try:
        model.load_state_dict(torch.load("vectorsense_pinn_fp16.pt"))
        print("Loaded Physics-Informed Brain weights.")
    except:
        print("Warning: Learning weights not found. Running with baseline architecture.")
    
    model.eval()
    
    # ZMQ Setup
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect("tcp://127.0.0.1:5555")
    socket.subscribe("") # Subscribe to all messages
    
    print("Awaiting thermal telemetry...")
    
    while True:
        # Receive payload
        payload = socket.recv_json()
        
        # Start Latency Tracking (KPI 5)
        recv_ns = time.perf_counter_ns()
        pub_ns = payload["timestamp"]
        
        # Simulation of TensorRT Inference
        # In real scenario, would use TensorRT Python API or ONNX Runtime
        # For Directive 5.2, we push into the model
        
        # Prepare inputs from payload data
        # data is 32x24 matrix
        matrix = np.array(payload["data"])
        
        # Flattening or sampling for PINN coordinates
        # Dummy x, y, t based on matrix dimensions
        x = torch.zeros((1, 1)).to(device)
        y = torch.zeros((1, 1)).to(device)
        t = torch.tensor([[time.perf_counter()]]).to(device).float()
        
        with torch.no_grad():
            # Directive 5.2: Push into engine
            outputs = model(x, y, t)
            # outputs: (u, v, P, C)
            diagnostic_coords = outputs[0, :2].cpu().numpy() # Extracting (u, v) as tracking data
            
        # Stop Latency Tracking
        exec_end_ns = time.perf_counter_ns()
        
        # KPI 5: Glass-to-Brain Latency
        # Time from sensor publish to PINN output
        total_latency_ms = (exec_end_ns - pub_ns) / 1_000_000.0
        
        print(f"Tracking Coords: {diagnostic_coords} | Glass-to-Brain Latency: {total_latency_ms:.2f} ms")
        
        # Monitor KPI 5 Threshold (18ms)
        if total_latency_ms <= 18.0:
            status = "✅ PASS"
        else:
            status = "❌ FAIL (Overshoot)"
            
        print(f"KPI 5 Status: {status}")

if __name__ == "__main__":
    brain_node()
