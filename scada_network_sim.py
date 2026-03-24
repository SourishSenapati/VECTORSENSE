#!/usr/bin/env python3
"""
SCADA Network Simulator for VectorSense.
Simulates industrial control system (ICS) traffic and digital twins.
"""
import logging
import sys
import time

import zmq

logging.basicConfig(level=logging.INFO, format="%(asctime)s [SCADA] %(message)s")

class SCADASimulator:
    """
    Simulates a SCADA system with digital pressure and valve status.
    Publishes status to ZeroMQ on port 5557.
    """

    def __init__(self, port: int = 5557) -> None:
        """Initializes the ZMQ PUB socket."""
        ctx = zmq.Context()
        self._pub = ctx.socket(zmq.PUB)
        self._pub.bind(f"tcp://*:{port}")
        self._port = port

    def run(self) -> None:
        """Main loop for broadcasting SCADA telemetry."""
        logging.info("SCADA Network Simulator Active on port %d", self._port)
        while True:
            # Simulated telemetry
            payload = {
                "digital_status": "CLOSED",
                "digital_pressure": "1.04 atm",
                "network_integrity": "SECURE",
                "timestamp": time.time()
            }
            import json
            self._pub.send_string(json.dumps(payload))
            time.sleep(1.0)

if __name__ == "__main__":
    sim = SCADASimulator()
    try:
        sim.run()
    except KeyboardInterrupt:
        logging.info("SCADA Sim terminated.")
