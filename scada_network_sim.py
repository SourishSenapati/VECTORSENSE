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
        """Initializes the ZMQ PUB/SUB sockets."""
        ctx = zmq.Context()
        self._pub = ctx.socket(zmq.PUB)
        self._pub.bind(f"tcp://*:{port}")
        self._sub = ctx.socket(zmq.SUB)
        self._sub.connect("tcp://127.0.0.1:5558")
        self._sub.setsockopt_string(zmq.SUBSCRIBE, "")
        self._sub.setsockopt(zmq.RCVTIMEO, 10) # 10ms timeout
        self._port = port
        self._valve_status = "CLOSED"
        self._pressure = 1.04

    def run(self) -> None:
        """Main loop for broadcasting SCADA telemetry and processing commands."""
        logging.info("SCADA Network Simulator Active. PUB: %d, SUB: 5558", self._port)
        import json
        while True:
            # Poll for commands
            try:
                raw_command = self._sub.recv_string()
                cmd_data = json.loads(raw_command)
                cmd_type = cmd_data.get("command")
                if cmd_type == "VALVE_LOCK":
                    self._valve_status = "LOCKED"
                elif cmd_type == "PURGE_GAS":
                    self._pressure = 0.5
                elif cmd_type == "DEPRESSURIZE":
                    self._pressure = 1.01
                elif cmd_type == "SHUTDOWN":
                    self._valve_status = "CLOSED"
                logging.info("Command Received: %s -> New State: %s, %.2f atm", 
                             cmd_type, self._valve_status, self._pressure)
            except zmq.Again:
                pass
            except Exception as e:
                logging.error("Command Error: %s", e)

            # Simulated telemetry
            payload = {
                "digital_status": self._valve_status,
                "digital_pressure": f"{self._pressure:.2f} atm",
                "network_integrity": "SECURE",
                "timestamp": time.time()
            }
            self._pub.send_string(json.dumps(payload))
            time.sleep(0.5)

if __name__ == "__main__":
    sim = SCADASimulator()
    try:
        sim.run()
    except KeyboardInterrupt:
        logging.info("SCADA Sim terminated.")
