from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from asyncua import Client
import logging
import uvicorn

app = FastAPI(title="VectorSense Industrial Actuation API")
logger = logging.getLogger("VectorSense.Actuator")

OPC_SERVER_URL = "opc.tcp://localhost:4840"

class ActuationRequest(BaseModel):
    valve_id: str
    state: str # "OPEN" or "CLOSED"

@app.post("/actuate")
async def actuate_valve(request: ActuationRequest):
    """
    Directive 3.2: The Digital-to-Physical Handshake.
    Triggers an OPC-UA write command to the DCS.
    """
    client = Client(OPC_SERVER_URL)
    try:
        async with client:
            # Locate the mitigation node
            # In a real environment, we'd browse or use a known NodeId
            # Matching the ns and string from the gateway
            node_id = f"ns=2;s=Actuate_Emergency_Isolation_Valve_{request.valve_id}"
            node = client.get_node(node_id)
            
            await node.write_value(request.state)
            logger.info(f"[ACTUATE] Valve {request.valve_id} state set to {request.state}")
            
            return {"status": "SUCCESS", "valve_id": request.valve_id, "state": request.state}
            
    except Exception as e:
        logger.error(f"[ACTUATE] Failed to command OPC-UA: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
