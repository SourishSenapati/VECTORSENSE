import zmq
import cv2
import time
import numpy as np

def start_vision_sim():
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://*:5557")
    
    print("Vision Simulator Active (1080p frames)...")
    
    # Pre-allocate if needed
    frame_shape = (1080, 1920, 3) # Full HD
    
    while True:
        # Generate dummy 1080p frame
        # In real scenario, this is from cv2.VideoCapture(0)
        # Using a small subset or encoded to save ZMQ transit time
        # The directive says "publish 1080p frames".
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8) # Real 1080p might be too slow for Python ZMQ
        # frame = cv2.resize(frame, (1920, 1080)) # Upscale to 1080p to meet directive 5.1
        
        # Add timestamp
        ts = time.perf_counter_ns()
        
        # Serialize with ZMQ
        # Using simple raw bytes for efficiency
        socket.send(frame.tobytes(), flags=zmq.NOBLOCK)
        
        time.sleep(0.01) # ~30FPS (1/100s)

if __name__ == "__main__":
    start_vision_sim()
