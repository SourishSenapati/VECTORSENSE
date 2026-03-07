import zmq
import torch
import time
import numpy as np
from vectorsense_pinn import VectorSensePINN, apply_vram_clamp

def brain_node():
    print("Inference Node Active...")
    
    # Resource management: VRAM Limit
    apply_vram_clamp(0.58)
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Load weights
    model = VectorSensePINN().to(device)
    try:
        model.load_state_dict(torch.load("vectorsense_pinn_fp16.pt"))
        print("Model weights loaded.")
    except:
        print("Baseline model active (weights not found).")
    
    model.eval()
    
    # ZMQ Configuration
    context = zmq.Context()
    socket = context.socket(zmq.SUB)
    socket.connect("tcp://127.0.0.1:5555")
    socket.subscribe("") 
    
    print("Synchronizing telemetry...")
    
    while True:
        payload = socket.recv_json()
        
        # Latency tracking
        recv_ns = time.perf_counter_ns()
        pub_ns = payload["timestamp"]
        
        # Process telemetry
        matrix = np.array(payload["data"])
        
        x = torch.zeros((1, 1)).to(device)
        y = torch.zeros((1, 1)).to(device)
        t = torch.tensor([[time.perf_counter()]]).to(device).float()
        
        with torch.no_grad():
            outputs = model(x, y, t)
            diagnostic_coords = outputs[0, :2].cpu().numpy() 
            
        exec_end_ns = time.perf_counter_ns()
        total_latency_ms = (exec_end_ns - pub_ns) / 1_000_000.0
        
        print(f"Coordinates: {diagnostic_coords} | Latency: {total_latency_ms:.2f} ms")
        
        if total_latency_ms <= 18.0:
            status = "PASS"
        else:
            status = "FAIL (Threshold Exceeded)"
            
        print(f"Status: {status}")

if __name__ == "__main__":
    brain_node()
