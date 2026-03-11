import asyncio
import zmq
import zmq.asyncio
import msgpack
import lz4.frame
from asyncua import ua, Server
import time
import logging

# Industrial Protocol Configuration
OPC_SERVER_URL = "opc.tcp://0.0.0.0:4840"
ZMQ_BASE_STATION_URL = "tcp://localhost:5556" # Dedicated telemetry feed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VectorSense.OPCGateway")

"""
VectorSense Industrial OPC-UA Gateway.
Translates sub-20ms ZeroMQ telemetry from the physical analytical kernel 
into industry-standard OPC-UA nodes for DCS/SCADA integration.
Utilization of asynchronous IO preserves deterministic latency targets.
"""

async def start_gateway():
    # Initialize OPC-UA Server
    server = Server()
    await server.init()
    server.set_endpoint(OPC_SERVER_URL)
    server.set_server_name("VectorSense Industrial Gateway")

    # Establish Namespace
    uri = "http://vectorsense.industrial.automation"
    idx = await server.register_namespace(uri)

    # Define Industrial Objects (The Swarm)
    swarm_obj = await server.nodes.objects.add_object(idx, "Industrial_Swarm")
    
    # Pre-instantiate nodes for designated drones to minimize runtime overhead
    drone_nodes = {}
    
    async def add_drone_node(name):
        drone = await swarm_obj.add_object(idx, name)
        # Explicit string-based NodeIds to satisfy Directive 1.2
        # Example format: ns=2;s=VectorSense_Alpha_1_Leak_X
        nodes = {
            "leak_x": await drone.add_variable(ua.NodeId(f"VectorSense_{name}_Leak_X", idx), f"{name}_Leak_X", 0.0),
            "leak_y": await drone.add_variable(ua.NodeId(f"VectorSense_{name}_Leak_Y", idx), f"{name}_Leak_Y", 0.0),
            "concentration": await drone.add_variable(ua.NodeId(f"VectorSense_{name}_Concentration", idx), f"{name}_Concentration", 0.0),
            "status": await drone.add_variable(ua.NodeId(f"VectorSense_{name}_Status", idx), f"{name}_Status", 0)
        }
        for node in nodes.values():
            await node.set_writable()
        return nodes

    # Directive 3.1: Closed-Loop Industrial Control (The Kill Switch)
    control_obj = await server.nodes.objects.add_object(idx, "Hazard_Mitigation")
    valve_104a = await control_obj.add_variable(
        ua.NodeId("Actuate_Emergency_Isolation_Valve_104A", idx), 
        "Valve_104A_State", 
        "OPEN"
    )
    await valve_104a.set_writable()

    # Initialize ZMQ Subscriber (Dedicated telemetry port)
    context = zmq.asyncio.Context()
    subscriber = context.socket(zmq.SUB)
    subscriber.connect(ZMQ_BASE_STATION_URL)
    subscriber.setsockopt(zmq.SUBSCRIBE, b"")

    logger.info(f"OPC-UA Server Active at {OPC_SERVER_URL}")
    logger.info(f"Subscribed to Base Station Telemetry at {ZMQ_BASE_STATION_URL}")

    async with server:
        while True:
            try:
                # Receive high-speed telemetry
                raw_data = await subscriber.recv()
                binary_payload = lz4.frame.decompress(raw_data)
                telemetry = msgpack.unpackb(binary_payload, raw=False)
                
                drone_id = telemetry.get("drone_id", "Unknown")
                if drone_id not in drone_nodes:
                    drone_nodes[drone_id] = await add_drone_node(drone_id)
                
                # Batch Update Logic (KPI-1: Translation Latency <= 5ms)
                ts_start = time.perf_counter()
                
                targets = drone_nodes[drone_id]
                await asyncio.gather(
                    targets["leak_x"].write_value(float(telemetry.get("x", 0.0))),
                    targets["leak_y"].write_value(float(telemetry.get("y", 0.0))),
                    targets["concentration"].write_value(float(telemetry.get("c", 0.0))),
                    targets["status"].write_value(int(telemetry.get("status", 0)))
                )
                
                latency_ms = (time.perf_counter() - ts_start) * 1000
                if latency_ms > 5.0:
                    logger.warning(f"Latency Ceiling Violation: {latency_ms:.2f}ms")
                else:
                    logger.debug(f"OPC-UA Update Synchronized: {latency_ms:.2f}ms")
                    
            except Exception as e:
                logger.error(f"Gateway Synchronization Failure: {e}")
                await asyncio.sleep(0.1)

if __name__ == "__main__":
    try:
        asyncio.run(start_gateway())
    except KeyboardInterrupt:
        logger.info("Gateway Shutdown Commenced.")
