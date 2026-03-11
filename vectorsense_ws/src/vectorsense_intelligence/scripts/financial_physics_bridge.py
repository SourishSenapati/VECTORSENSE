"""
Cyber-Physical Discrepancy Engine and Multi-Modal Bridge.
Compares real-time physical data with digital SCADA telemetry to detect cyberattacks.
"""

import asyncio
import json
import logging
import websockets
import zmq
import zmq.asyncio

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VectorSense.TruthEngine")

# ZeroMQ Addresses
ZMQ_REAL_PHYSICS = "tcp://127.0.0.1:5556"  # Ground Truth from Gazebo
ZMQ_SCADA_NET = "tcp://127.0.0.1:5557"     # Compromised Digital reporting
ZMQ_MISSION_CMD = "tcp://127.0.0.1:5558"   # Mission Control Command Line

class DiscrepancyEngineBridge:
    """
    Directive 1.1: Cyber-Physical Discrepancy Engine + Multi-Modal Controller.
    """
    def __init__(self, ws_port=8000):
        self.ws_port = ws_port
        self.clients = set()
        self.ctx = zmq.asyncio.Context()
        # Sockets
        self.sub_physics = self.ctx.socket(zmq.SUB)
        self.sub_scada = self.ctx.socket(zmq.SUB)
        self.pub_mission = self.ctx.socket(zmq.PUB)
        # State
        self.last_scada = {}
        self.last_physics = {"mode": "GAS_TOMOGRAPHY"}

    async def start(self):
        """Initializes sockets and starts the asynchronous processing loops."""
        self.sub_physics.connect(ZMQ_REAL_PHYSICS)
        self.sub_physics.setsockopt_string(zmq.SUBSCRIBE, "")
        self.sub_scada.connect(ZMQ_SCADA_NET)
        self.sub_scada.setsockopt_string(zmq.SUBSCRIBE, "")
        self.pub_mission.bind(ZMQ_MISSION_CMD)
        logger.info("[TRUTH] Engine Active. Link: %s", ZMQ_MISSION_CMD)
        async with websockets.serve(self.ws_handler, "0.0.0.0", self.ws_port):
            await asyncio.gather(
                self.physics_listener(),
                self.scada_listener(),
                self.discrepancy_loop()
            )

    async def physics_listener(self):
        """Listens for real-time physics data from the PINN engine."""
        while True:
            msg = await self.sub_physics.recv_string()
            self.last_physics = json.loads(msg)

    async def scada_listener(self):
        """Listens for digital telemetry from the SCADA network simulator."""
        while True:
            msg = await self.sub_scada.recv_string()
            self.last_scada = json.loads(msg)

    async def discrepancy_loop(self):
        """Continuously compares reality vs digital reporting to flag discrepancies."""
        while True:
            is_leaking = self.last_physics.get("leak", False)
            scada_closed = self.last_scada.get("digital_status") == "CLOSED"
            mission_mode = self.last_physics.get("mode", "GAS_TOMOGRAPHY")
            discrepancy = False
            alert_type = "NOMINAL"
            if mission_mode == "GAS_TOMOGRAPHY" and is_leaking and scada_closed:
                discrepancy = True
                alert_type = "SCADA_SPOOFING_DETECTED"
            payload = {
                "reality": self.last_physics,
                "network": self.last_scada,
                "cyber_physical_discrepancy": discrepancy,
                "alert_status": alert_type,
                "mission_mode": mission_mode,
                "source": "DISCREPANCY_ENGINE"
            }
            if self.clients:
                raw_payload = json.dumps(payload)
                await asyncio.gather(*[c.send(raw_payload) for c in self.clients])
            await asyncio.sleep(0.1)

    async def ws_handler(self, websocket):
        """Handles dashboard WebSocket connections and mission mode changes."""
        self.clients.add(websocket)
        try:
            async for message in websocket:
                data = json.loads(message)
                if data.get("type") == "MISSION_CHANGE":
                    new_mode = data.get("mode")
                    self.pub_mission.send_string(new_mode)
                    logger.info("[MISSION] Requesting Global Shift to: %s", new_mode)
        finally:
            self.clients.remove(websocket)

if __name__ == "__main__":
    bridge_engine = DiscrepancyEngineBridge()
    asyncio.run(bridge_engine.start())
