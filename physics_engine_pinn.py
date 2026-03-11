"""
Multi-Modal Adaptive Brain (Edge Kernel) for VectorSense.
"""
import json
import time
import zmq

class MultiModalPINN:
    """
    Directive 2.1: Multi-Modal General Purpose Brain (Adaptive Edge Kernel).
    """
    def __init__(self):
        self.ctx = zmq.Context()
        # Sockets
        self.sub_sock = self.ctx.socket(zmq.SUB)
        self.sub_sock.connect("tcp://127.0.0.1:5555")
        self.sub_sock.setsockopt_string(zmq.SUBSCRIBE, "")
        self.sub_mission = self.ctx.socket(zmq.SUB)
        self.sub_mission.connect("tcp://127.0.0.1:5558")
        self.sub_mission.setsockopt_string(zmq.SUBSCRIBE, "")
        self.pub_sock = self.ctx.socket(zmq.PUB)
        self.pub_sock.bind("tcp://127.0.0.1:5556")
        # State
        self.mission_mode = "GAS_TOMOGRAPHY"

    def run(self):
        """Main loop."""
        print("[ENGINE] Multi-Modal Adaptive Brain Active...")
        while True:
            try:
                mode_update = self.sub_mission.recv_string(flags=zmq.NOBLOCK)
                self.mission_mode = mode_update
                print(f"[MISSION] Brain profile shifted to: {self.mission_mode}")
            except zmq.Again:
                pass
            try:
                msg = self.sub_sock.recv_string(flags=zmq.NOBLOCK)
                data = json.loads(msg)
                processed_intel = self.process_multi_modal(data)
                self.pub_sock.send_string(json.dumps(processed_intel))
            except zmq.Again:
                pass
            time.sleep(0.01)

    def process_multi_modal(self, raw_data):
        """Process data based on mode."""
        intel = {
            "source": "PINN_KERNEL",
            "mode": self.mission_mode,
            "leak": False,
            "anomaly_detected": False,
            "pos": raw_data.get("pos", [0, 0, 0])
        }
        if self.mission_mode == "GAS_TOMOGRAPHY":
            if raw_data.get("gas_leak"):
                intel["leak"] = True
                intel["mass_loss"] = 0.45
                intel["plume_origin"] = [5.0, 5.0, 8.0]
        elif self.mission_mode == "THERMAL_PROFILING":
            temp = raw_data.get("thermal_signature", 300)
            if temp > 150:
                intel["anomaly_detected"] = True
                intel["anomaly_type"] = "REFRACTORY LINING FAILURE"
                intel["temp_intensity"] = temp
                intel["anomaly_pos"] = [10.0, -5.0, 2.5]
        elif self.mission_mode == "ACOUSTIC_DIAGNOSTICS":
            db_level = raw_data.get("acoustic_db", 45)
            if db_level > 80:
                intel["anomaly_detected"] = True
                intel["anomaly_type"] = "PUMP CAVITATION DETECTED"
                intel["db_level"] = db_level
                intel["anomaly_pos"] = [-10.0, 10.0, 0.5]
        return intel

if __name__ == "__main__":
    engine = MultiModalPINN()
    engine.run()
