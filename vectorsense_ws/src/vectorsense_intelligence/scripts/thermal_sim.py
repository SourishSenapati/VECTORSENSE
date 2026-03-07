import zmq
import numpy as np
import time
import json

def start_thermal_sim():
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://*:5555")
    
    print("Thermal Simulator Active...")
    
    while True:
        # Simulate 32x24 thermal matrix
        matrix = np.random.rand(32, 24).astype(np.float32)
        
        # Add metadata (timestamp)
        payload = {
            "timestamp": time.perf_counter_ns(),
            "data": matrix.tolist()
        }
        
        socket.send_json(payload)
        time.sleep(0.1) # 10Hz

if __name__ == "__main__":
    start_thermal_sim()
