import zmq
import numpy as np
import time

def start_acoustic_sim():
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://*:5556")
    
    print("Acoustic Simulator Active (1D arrays)...")
    
    while True:
        # Generate 1D audio array (44100Hz, small buffer)
        array = np.random.rand(1024).astype(np.float32)
        
        # Add timestamp
        payload = {
            "timestamp": time.perf_counter_ns(),
            "data": array.tolist()
        }
        
        socket.send_json(payload)
        time.sleep(0.01) # ~100Hz

if __name__ == "__main__":
    start_acoustic_sim()
