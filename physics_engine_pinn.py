import zmq
import time
import json
import math

def run_simulation():
    ctx = zmq.Context()
    sock = ctx.socket(zmq.PUB)
    sock.bind(tcp://127.0.0.1:5556)
    
    print(PINN
