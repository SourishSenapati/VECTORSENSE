import asyncio
import websockets
import zmq
import zmq.asyncio
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VectorSense.TruthEngine")

# ZeroMQ Addresses
ZMQ_REAL_PHYSICS = "tcp://127.0.0.1:5556" # Ground Truth from Gazebo
ZMQ_SCADA_NET    = "tcp://127.0.0.1:5557" # Compromised Digital reporting

class DiscrepancyEngineBridge:
    """
    Directive 1.1: Cyber-Physical Discrepancy Engine.
    Detects state-sponsored sabotage by comparing physical reality (PINN) 
    against digital reporting (SCADA).
    """
    def __init__(self, ws_port=8000):
        self.ws_port = ws_port
        self.clients = set()
        self.ctx = zmq.asyncio.Context()
        
        # Sockets
        self.sub_physics = self.ctx.socket(zmq.SUB)
        self.sub_scada = self.ctx.socket(zmq.SUB)
        
        # State
        self.last_scada = {}
        self.last_physics = {}

    async def start(self):
        self.sub_physics.connect(ZMQ_REAL_PHYSICS)
        self.sub_physics.setsockopt_string(zmq.SUBSCRIBE, "")
        
        self.sub_scada.connect(ZMQ_SCADA_NET)
        self.sub_scada.setsockopt_string(zmq.SUBSCRIBE, "")
        
        logger.info(f"[TRUTH] Ingesting Reality from {ZMQ_REAL_PHYSICS}")
        logger.info(f"[TRUTH] Ingesting Network from {ZMQ_SCADA_NET}")

        async with websockets.serve(self.ws_handler, "0.0.0.0", self.ws_port):
            await asyncio.gather(
                self.physics_listener(),
                self.scada_listener(),
                self.discrepancy_loop()
            )

    async def physics_listener(self):
        while True:
            msg = await self.sub_physics.recv_string()
            self.last_physics = json.loads(msg)

    async def scada_listener(self):
        while True:
            msg = await self.sub_scada.recv_string()
            self.last_scada = json.loads(msg)

    async def discrepancy_loop(self):
        """
        The Intelligence Logic: Detects mismatches between bits and atoms.
        """
        while True:
            # Logic: If SCADA says CLOSED but Physics shows LEAK > 0
            is_leaking = self.last_physics.get("leak", False)
            scada_closed = self.last_scada.get("digital_status") == "CLOSED"
            
            discrepancy = False
            alert_type = "NOMINAL"

            if is_leaking and scada_closed:
                discrepancy = True
                alert_type = "SCADA_SPOOFING_DETECTED"
                logger.warning("!!! CYBER-PHYSICAL DISCREPANCY DETECTED: Physical Leak under Hacked SCADA Status !!!")

            payload = {
                "reality": self.last_physics,
                "network": self.last_scada,
                "cyber_physical_discrepancy": discrepancy,
                "alert_status": alert_type,
                "source": "DISCREPANCY_ENGINE"
            }

            if self.clients:
                raw_payload = json.dumps(payload)
                await asyncio.gather(*[c.send(raw_payload) for c in self.clients])
            
            await asyncio.sleep(0.1)

    async def ws_handler(self, websocket):
        self.clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)

if __name__ == "__main__":
    engine = DiscrepancyEngineBridge()
    asyncio.run(engine.start())
