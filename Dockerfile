FROM osrf/ros:jazzy-desktop-full

# Install VNC and noVNC
RUN apt-get update && apt-get install -y \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    python3-pip \
    python3-zmq \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    websockets \
    pyzmq \
    msgpack \
    lz4

# Set up workspace
WORKDIR /workspace
COPY . /workspace/

# Expose ports
EXPOSE 6080 8001 5556 5557 8000

# Launch script
CMD ["/bin/bash", "/workspace/launch_sim.sh"]
