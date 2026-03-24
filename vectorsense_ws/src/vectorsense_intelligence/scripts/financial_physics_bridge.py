"""
financial_physics_bridge.py — VectorSense Windows Base Station.

Consumes ZMQ PUB from PINN (5556) and SCADA (5557).
Broadcasts everything to the React dashboard via WebSocket (8000).
"""
import asyncio
import json
import logging
import sys
from typing import Any

# Windows-specific asyncio fix
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import lz4.frame
import msgpack
import websockets
import zmq
import zmq.asyncio
from websockets.exceptions import ConnectionClosed

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [BRIDGE] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
log = logging.getLogger("vectorsense.bridge")

# Connections
_ZMQ_PINN = "tcp://127.0.0.1:5556"
_ZMQ_SCADA = "tcp://127.0.0.1:5557"
_WS_HOST = "0.0.0.0"
_WS_PORT = 8000

class FinancialPhysicsBridge:
    """Consolidates data streams and broadcasts for Visualization."""

    def __init__(self) -> None:
        """Initializes state and ZMQ subscriptions."""
        self._clients: set = set()
        self._last_physics: dict[str, Any] = {}
        self._last_scada: dict[str, Any] = {
            "digital_status": "CLOSED",
            "digital_pressure": "1.00 atm",
            "network_integrity": "OK"
        }
        self._mission_mode: str = "GAS_TOMOGRAPHY"

        ctx = zmq.asyncio.Context()
        self._p_sub = ctx.socket(zmq.SUB)
        self._p_sub.setsockopt(zmq.SUBSCRIBE, b"")
        self._p_sub.connect(_ZMQ_PINN)
        
        self._s_sub = ctx.socket(zmq.SUB)
        self._s_sub.setsockopt(zmq.SUBSCRIBE, b"")
        self._s_sub.connect(_ZMQ_SCADA)
        
        log.info("Financial Bridge: ONLINE. SUBs: 5556, 5557")

    async def start(self) -> None:
        """Starts the WebSocket server and listeners."""
        async with websockets.serve(self._ws_handler, _WS_HOST, _WS_PORT):
            log.info("WebSocket: LISTENING on port %d", _WS_PORT)
            await asyncio.gather(
                self._p_listener(),
                self._s_listener(),
                self._broadcast_ticker()
            )

    async def _p_listener(self) -> None:
        """PINN Physics Listener (Expects msgpack)."""
        while True:
            try:
                # PINN Engine (5556) sends UNCOMPRESSED msgpack
                raw: bytes = await self._p_sub.recv()
                self._last_physics = msgpack.unpackb(raw, raw=False)
            except Exception as e:
                log.error("PINN_SUB_ERR: %s", e)
                await asyncio.sleep(0.1)

    async def _s_listener(self) -> None:
        """SCADA Network Listener (Expects JSON string)."""
        while True:
            try:
                raw: str = await self._s_sub.recv_string()
                self._last_scada = json.loads(raw)
            except Exception as e:
                log.error("SCADA_SUB_ERR: %s", e)
                await asyncio.sleep(0.1)

    async def _broadcast_ticker(self) -> None:
        """Broadcasts consolidated telemetry at 24Hz."""
        while True:
            await asyncio.sleep(0.04)
            if not self._last_physics:
                continue

            payload = {
                "source": "DISCREPANCY_ENGINE",
                "reality": self._last_physics,
                "network": self._last_scada,
                "cyber_physical_discrepancy": (
                    self._last_physics.get("leak", False) and 
                    self._last_scada.get("digital_status") == "CLOSED"
                ),
                "alert_status": "NOMINAL",
                "mission_mode": self._mission_mode,
                "infrastructure_status": {
                    "GAZEBO_BRIDGE": ("CONNECTED" if self._last_physics.get("status") == "CORE_SYNC_OK" 
                                      else "OFFLINE"),
                    "PINN_KERNEL": "CONNECTED",
                    "DCS_GATEWAY": "ENCRYPTED"
                }
            }

            if self._clients:
                raw = json.dumps(payload)
                await asyncio.gather(
                    *[c.send(raw) for c in list(self._clients)],
                    return_exceptions=True
                )

    async def _ws_handler(self, ws) -> None:
        """Handles dashboard client connection."""
        log.info("[WS] Client connected")
        self._clients.add(ws)
        try:
            async for message in ws:
                try:
                    data = json.loads(message)
                    if data.get("type") == "MISSION_CHANGE":
                        self._mission_mode = data.get("mode", self._mission_mode)
                        log.info("[MISSION] -> %s", self._mission_mode)
                except json.JSONDecodeError:
                    pass
        except ConnectionClosed:
            pass
        finally:
            log.info("[WS] Client disconnected")
            self._clients.discard(ws)

if __name__ == "__main__":
    bridge = FinancialPhysicsBridge()
    try:
        asyncio.run(bridge.start())
    except KeyboardInterrupt:
        log.info("Bridge Stopped.")
