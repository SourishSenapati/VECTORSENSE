import zmq
import msgpack
import lz4.frame
import torch
import time
import numpy as np
import logging
from vectorsense_pinn import VectorSensePINN
from swarm_coordinator_cuda import SwarmCoordinator
from vectorsense_auditor import IndustrialAuditor
from docking_state_machine import DockingManager, MissionState
from sindy_calibration import run_sindy_calibration

# Configuration
ZMQ_ROUTER_PORT = 5555
ZMQ_PUB_PORT = 5556

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VectorSense.BaseStation")

class BaseStationGroundController:
    """
    Directive 5.1 & 5.2: Manages SINDy Docking and Calibration Trigger.
    """
    def __init__(self):
        self.dock_manager = DockingManager()
        self.active_drones = {} # ID -> MissionState

    def handle_docking_event(self, drone_id, is_armed, contact_confirmed, sensor_data):
        """
        Directive 5.3: Recalibration Trigger logic.
        """
        self.dock_manager.update_state(is_armed, contact_confirmed)
        
        if self.dock_manager.state == MissionState.CALIBRATING:
            logger.info(f"[GND] Recalibration Sequence Authorized for {drone_id}")
            # Run SINDy Optimization (KPI-5: 10ppm precision)
            success = self.dock_manager.run_sindy_recalibration(sensor_data)
            if success:
                logger.info(f"[SUCCESS] {drone_id} SINDy Matrix Updated.")
                return True
        return False

def start_base_station():
    """
    VectorSense Industrial Base Station Executive.
    Natively optimized for Windows with RTX 4050 GPU acceleration.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Base Station Computation Unit: {device}")
    
    # Load High-Precision Global Model (Uncompressed PINN)
    model = VectorSensePINN().to(device).eval()
    try:
        model.load_state_dict(torch.load("vectorsense_pinn_fp16.pt"))
        logger.info("Heavy Analytical Weights Loaded (FP16).")
    except Exception as e:
        logger.warning(f"Baseline physics model active: {e}")

    # ZMQ Networking
    context = zmq.Context()
    router = context.socket(zmq.ROUTER)
    router.bind(f"tcp://*:{ZMQ_ROUTER_PORT}")
    
    pub_socket = context.socket(zmq.PUB)
    pub_socket.bind(f"tcp://*:{ZMQ_PUB_PORT}")
    
    # Industrial Modules
    coordinator = SwarmCoordinator()
    auditor = IndustrialAuditor()
    ground_ctrl = BaseStationGroundController()
    
    logger.info(f"Industrial Connectors Bound: ROUTER:{ZMQ_ROUTER_PORT} | PUB:{ZMQ_PUB_PORT}")
    logger.info("System Online. Monitoring Industrial Swarm...")

    while True:
        try:
            # Multi-part message: [Identity, Payload]
            identity, compressed_payload = router.recv_multipart()
            
            # Decompression (KPI-3: < 1ms on main loop)
            binary_payload = lz4.frame.decompress(compressed_payload)
            state = msgpack.unpackb(binary_payload, raw=False)
            
            drone_id = identity.decode('utf-8', 'ignore')
            ts_start = time.perf_counter()
            
            # 1. Swarm APF Force Calculation (KPI-2: < 2ms)
            drone_pos = np.array([state.get("pos", [0,0,0])]) 
            leak_source = np.array([[5.0, 5.0, 5.5]]) 
            net_vectors, apf_latency = coordinator.calculate_swarm_vectors(drone_pos, leak_source)
            
            # 2. Cryptographic Logging (Directive 3.2 & 3.3)
            auditor.log_telemetry(state)
            
            # 3. Industrial Gateway Transmission (Directive 1.3)
            # Batch update OPC-UA via PUBSUB Bridge
            telemetry_packet = {
                "drone_id": drone_id,
                "x": float(drone_pos[0,0]),
                "y": float(drone_pos[0,1]),
                "c": float(state.get("concentration", 0.0)),
                "status": 1 if state.get("concentration", 0.0) > 50.0 else 0
            }
            pub_socket.send(lz4.frame.compress(msgpack.packb(telemetry_packet)))
            
            # 4. Ground/Docking Logic (Phase 5)
            if not state.get("is_armed", True):
                # Potential docking scenario
                ground_ctrl.handle_docking_event(
                    drone_id, 
                    state.get("is_armed"), 
                    state.get("contact_confirmed", False),
                    state.get("sensor_voltages", np.zeros(50))
                )
            
            # 5. Response Generation
            resolution = {
                "swarm_offset": net_vectors[0].tolist(),
                "status": "PROCESSED",
                "timestamp": time.time()
            }
            response_binary = lz4.frame.compress(msgpack.packb(resolution, use_bin_type=True))
            router.send_multipart([identity, response_binary])
            
            processing_ms = (time.perf_counter() - ts_start) * 1000.0
            if processing_ms > 20.0:
                logger.warning(f"Latency Target Breach: {processing_ms:.2f}ms")
            
        except KeyboardInterrupt:
            logger.info("Base Station Shutdown Commenced.")
            break
        except Exception as e:
            logger.error(f"Ingestion Failure: {e}")

if __name__ == "__main__":
    start_base_station()
