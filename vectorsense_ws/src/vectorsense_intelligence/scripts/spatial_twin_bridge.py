import asyncio
import websockets
import zmq
import zmq.asyncio
import msgpack
import lz4.frame
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VectorSense.TwinBridge")

# ZeroMQ Connections
ZMQ_ROUTER_ADDR = "tcp://127.0.0.1:5555" # PINN/Drone Telemetry
ZMQ_SIM_ADDR = "tcp://127.0.0.1:5556"    # Live Gazebo Physics
ZMQ_OPC_ADDR = "tcp://127.0.0.1:4840"    # Inverted: In reality a bridge to OPC node

class SpatialTwinBridge:
    """
    Directive 1.2: Volumetric XR Bridge.
    Subscribes to ZMQ ROI/Tensors and broadcasts to WebGL frontend at 60Hz.
    """
    def __init__(self, ws_port=8000):
        self.ws_port = ws_port
        self.clients = set()
        self.ctx = zmq.asyncio.Context()
        self.zmq_sock = self.ctx.socket(zmq.ROUTER)
        self.zmq_sim = self.ctx.socket(zmq.SUB)
        
    async def start(self):
        # Bind to collect drone & PINN telemetry
        self.zmq_sock.bind(ZMQ_ROUTER_ADDR)
        self.zmq_sim.connect(ZMQ_SIM_ADDR)
        self.zmq_sim.setsockopt_string(zmq.SUBSCRIBE, "")
        
        logger.info(f"[ZMQ] Listening for Physics Tensors on {ZMQ_ROUTER_ADDR}")
        logger.info(f"[ZMQ] Subscribing to Gazebo on {ZMQ_SIM_ADDR}")
        
        # Start WebSocket Server
        async with websockets.serve(self.ws_handler, "0.0.0.0", self.ws_port):
            logger.info(f"[WS] Spatial Twin Server active on port {self.ws_port}")
            await asyncio.gather(self.zmq_listener(), self.sim_listener())

    async def sim_listener(self):
        """
        Subscribes to Gazebo plugin data and broadcasts as JSON.
        """
        while True:
            try:
                msg = await self.zmq_sim.recv_string()
                data = json.loads(msg)
                if self.clients:
                    payload = json.dumps(data)
                    await asyncio.gather(*[client.send(payload) for client in self.clients])
            except Exception as e:
                logger.error(f"[SIM] Error: {e}")
                await asyncio.sleep(0.01)


    async def ws_handler(self, websocket):
        self.clients.add(websocket)
        logger.info(f"[WS] Client Connected. Total: {len(self.clients)}")
        try:
            await websocket.wait_closed()
        finally:
            self.clients.remove(websocket)
            logger.info(f"[WS] Client Disconnected. Total: {len(self.clients)}")

    async def zmq_listener(self):
        """
        Polls ZeroMQ for PINN/Drone data and broadcasts JSON to WebSocket.
        """
        while True:
            try:
                # ROUTER: [Identity, Payload]
                frames = await self.zmq_sock.recv_multipart()
                if len(frames) < 2: continue
                
                # Decompress and Unpack
                compressed = frames[1]
                uncompressed = lz4.frame.decompress(compressed)
                data = msgpack.unpackb(uncompressed, raw=False)
                
                # Directive 1.1: Volumetric Tensor (Subsample for WebGL performance)
                # Ensure data is JSON serializable
                if "plume_tensor" in data:
                    # Tensors can be large; we extract regions of interest or slices
                    data["plume_tensor"] = data["plume_tensor"][:500] if isinstance(data["plume_tensor"], list) else []
                
                # Broadcast to all connected XR dashboards
                if self.clients:
                    payload = json.dumps(data)
                    await asyncio.gather(*[client.send(payload) for client in self.clients])
                    
            except Exception as e:
                logger.error(f"[BRIDGE] Telemetry processing error: {e}")
                await asyncio.sleep(0.01)

if __name__ == "__main__":
    bridge = SpatialTwinBridge()
    asyncio.run(bridge.start())
