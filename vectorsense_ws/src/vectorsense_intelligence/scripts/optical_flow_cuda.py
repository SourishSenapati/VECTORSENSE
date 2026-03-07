import cv2
import numpy as np
import time

def run_cuda_optical_flow(video_path=None):
    # Directive 4.1: Verification of cv2.cuda
    count = cv2.cuda.getCudaEnabledDeviceCount()
    if count == 0:
        print("CRITICAL: OpenCV compiled WITHOUT CUDA. Phase 4 FAILED.")
        return
    
    print(f"CUDA Vision Pipeline Online. Using {count} GPU devices.")
    
    # Initialize GpuMats (Directive 4.2: Keep matrices on device)
    prev_frame_gpu = cv2.cuda_GpuMat()
    curr_frame_gpu = cv2.cuda_GpuMat()
    
    # Initialize Farneback Optical Flow on GPU
    # Farneback parameters
    flow_gpu = cv2.cuda_FarnebackOpticalFlow.create(numLevels=5, pyrScale=0.5, fastPyramids=False, winSize=13, numIters=10, polyN=5, polySigma=1.1, flags=0)
    
    # Open video or camera
    cap = cv2.VideoCapture(video_path if video_path else 0)
    if not cap.isOpened():
        print("Camera/Video not found.")
        return
    
    ret, frame = cap.read()
    if not ret:
        return
    
    prev_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    prev_frame_gpu.upload(prev_gray)
    
    fps_start = time.perf_counter()
    frame_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Uploading to GPU
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        curr_frame_gpu.upload(gray)
        
        # Directive 4.2: Calculation on GPU (cv2.cuda_FarnebackOpticalFlow)
        d_flow = flow_gpu.calc(prev_frame_gpu, curr_frame_gpu, None) # This returns a GpuMat
        
        # Mapping vibration/momentum boundary conditions (mock update to PINN flow)
        # In real scenario, we'd sample d_flow at specific points
        
        # Keep on device as much as possible
        prev_frame_gpu.copyTo(curr_frame_gpu)
        
        frame_count += 1
        elapsed = time.perf_counter() - fps_start
        if elapsed > 1.0:
            fps = frame_count / elapsed
            print(f"Vision Throughput: {fps:.2f} FPS") # KPI 4: > 120 FPS
            frame_count = 0
            fps_start = time.perf_counter()
            
        # Exit on 'q'
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # If the user has a video file, they can pass it here
    run_cuda_optical_flow()
