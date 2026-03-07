import zmq
import torch
import time
import numpy as np
import threading
import json
import os
import sys
from collections import deque
from vectorsense_pinn import VectorSensePINN, apply_vram_clamp

"""
VectorSense Inference Executive: Real-Time Multi-Spectral Fusion Engine.
Handles high-speed ZeroMQ ingestion, cross-sensor synchronization, 
and GPU-accelerated PINN extrapolation for industrial toxic leak localization.
"""

class SensorFusionEngine:
    def __init__(self, buffer_size=100):
        # Thread-safe buffers for multi-rate sensors
        self.thermal_buffer = deque(maxlen=buffer_size)
        self.gas_buffer = deque(maxlen=buffer_size)
        self.acoustic_buffer = deque(maxlen=buffer_size)
        
        # Statistics for Glass-to-Brain Latency Tracking (KPI 5)
        self.latencies = deque(maxlen=1000)
        self.lock = threading.Lock()
        
        # Operational State
        self.is_running = True
        self.last_sync_time = 0

    def add_thermal_data(self, data, timestamp):
        with self.lock:
            self.thermal_buffer.append((timestamp, data))

    def add_gas_data(self, data, timestamp):
        with self.lock:
            self.gas_buffer.append((timestamp, data))

    def add_acoustic_data(self, data, timestamp):
        with self.lock:
            self.acoustic_buffer.append((timestamp, data))

    def calculate_fused_state(self):
        """
        Heuristic fusion of multi-spectral data to generate 
        initial distribution for the PINN solver.
        """
        with self.lock:
            if not self.thermal_buffer or not self.gas_buffer:
                return None
            
            # Simple temporal synchronization
            t_data, thermal = self.thermal_buffer[-1]
            g_data, gas = self.gas_buffer[-1]
            
            # Heuristic: Thermal anomalies + high Gas concentration = high probability source
            # In a real industrial setting, this would involve a Kalman Filter
            return (t_data, thermal, gas)

class InferenceNode:
    def __init__(self, model_path="vectorsense_pinn_fp16.pt", zmq_endpoint="tcp://127.0.0.1:5555"):
        # Hardware Environment Setup
        apply_vram_clamp(0.58)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize Neural Architecture
        self.model = VectorSensePINN().to(self.device).eval()
        self.load_weights(model_path)
        
        # Communication Layer
        self.context = zmq.Context()
        self.subscriber = self.context.socket(zmq.SUB)
        self.subscriber.connect(zmq_endpoint)
        self.subscriber.setsockopt_string(zmq.SUBSCRIBE, "")
        
        # Data Processing Layer
        self.fusion_engine = SensorFusionEngine()
        self.inference_thread = threading.Thread(target=self.inference_loop)
        
        print(f"[NODE] VectorSense Core Initialized on {self.device}")

    def load_weights(self, path):
        if os.path.exists(path):
            try:
                self.model.load_state_dict(torch.load(path))
                print(f"[READY] High-precision weights loaded from {path}")
            except Exception as e:
                print(f"[ERR] Model loading failed: {e}")
        else:
            print("[WARN] No weights found. Operating in baseline physical mode.")

    def ingest_loop(self):
        """
        Asynchronous ZeroMQ Ingestion Pipe.
        """
        print("[INGEST] ZeroMQ Subscriber Active at 1000Hz polling.")
        while True:
            try:
                # Receive payload
                topic, payload_raw = self.subscriber.recv_multipart()
                payload = json.loads(payload_raw)
                
                # Logic based on sensor topic
                ts = payload.get("timestamp")
                data = np.array(payload.get("data"))
                
                if topic == b"thermal":
                    self.fusion_engine.add_thermal_data(data, ts)
                elif topic == b"gas":
                    self.fusion_engine.add_gas_data(data, ts)
                elif topic == b"acoustic":
                    self.fusion_engine.add_acoustic_data(data, ts)
                    
            except Exception as e:
                print(f"[INGEST ERR] {e}")
                time.sleep(0.1)

    def inference_loop(self):
        """
        Primary Computational loop for PINN estimation.
        """
        print("[BRAIN] Physics Inference Loop Online.")
        while True:
            state = self.fusion_engine.calculate_fused_state()
            if state is None:
                time.sleep(0.01)
                continue
                
            ts_start = time.perf_counter_ns()
            ts_sensor, thermal, gas = state
            
            # Prepare Spatial Tensor Block (Simulating 32x24 sensing grid)
            # x, y grids from 0 to 1
            xx, yy = np.meshgrid(np.linspace(0, 1, 32), np.linspace(0, 1, 24))
            x_t = torch.tensor(xx.flatten(), device=self.device).view(-1, 1).float()
            y_t = torch.tensor(yy.flatten(), device=self.device).view(-1, 1).float()
            t_t = torch.ones_like(x_t) * (time.time() % 100) # Local time slice
            
            # Deterministic PINN Inference
            with torch.no_grad():
                pred = self.model(x_t, y_t, t_t)
                u, v, P, C = pred[:, 0], pred[:, 1], pred[:, 2], pred[:, 3]
            
            # Post-Processing: Find Peak Concentration (Source Localization)
            idx_max = torch.argmax(C)
            source_x = x_t[idx_max].item()
            source_y = y_t[idx_max].item()
            
            # Latency Verification (KPI 5)
            ts_end = time.perf_counter_ns()
            latency_ms = (ts_end - ts_sensor) / 1_000_000.0
            
            if latency_ms > 18.0:
                sys.stdout.write(f"\r[ALERT] IPC Latency Breach: {latency_ms:.2f}ms   ")
            else:
                sys.stdout.write(f"\r[STABLE] Source: ({source_x:.2f}, {source_y:.2f}) | Latency: {latency_ms:.2f}ms   ")
            sys.stdout.flush()
            
            # Throttle to 30Hz target to save power on Jetson
            time.sleep(0.033)

    def start(self):
        # Multi-threaded execution for high parallelism
        ingest_thread = threading.Thread(target=self.ingest_loop, daemon=True)
        ingest_thread.start()
        self.inference_loop()

if __name__ == "__main__":
    # Operational Entry Point
    node = InferenceNode()
    try:
        node.start()
    except KeyboardInterrupt:
        print("\n[FIN] Graceful shutdown of Inference Node.")
        sys.exit(0)
