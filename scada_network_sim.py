import zmq
import time
import json

def scada_simulator():
    """
    Directive: The 'Stuxnet' Mock.
    Simulates a compromised plant network reporting false 'NORMAL' status
    while physical failures occur.
    """
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://127.0.0.1:5557")

    print("[SCADA_NET] Broadcasting Digital 'Truth' on Port 5557...")
    
    while True:
        # Hostile Reporting: Emulates hacked PLCs reporting nominal state
        scada_payload = {
            "node_id": "Valve_104A",
            "digital_status": "CLOSED",
            "digital_pressure": "1.01 atm",
            "network_integrity": "SECURE",
            "timestamp": time.time()
        }
        
        socket.send_string(json.dumps(scada_payload))
        time.sleep(1.0) # Low frequency reporting common in legacy SCADA

if __name__ == "__main__":
    scada_simulator()
