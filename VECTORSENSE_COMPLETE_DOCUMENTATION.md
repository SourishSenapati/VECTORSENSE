# VectorSense

Autonomous gas leak detection drone with AI-based sensor fusion and a live industrial dashboard.

Built as the final project for the SURE ProEd SURE TRUST G5 Robotics Internship by Sourish Senapati.

## What This Project Is

VectorSense is a hexacopter drone platform designed to fly autonomously through industrial facilities — refineries, chemical plants, gas processing units — and detect hazardous gas leaks using a combination of electrochemical sensors, thermal imaging, and ultrasonic emission detection. The drone doesn't just report a number; it uses a Physics-Informed Neural Network (PINN) to model how gas actually moves through the air according to fluid dynamics laws, then tells you what gas it is, where the source is, and what the regulatory cost of the leak is per hour.

The whole system is controlled and monitored through a browser-based dashboard with a live 3D simulation of the drone navigating the plant.

## What Was Built

### The Drone

A 550 mm hexacopter frame carrying:

- MQ-2, MQ-135, MQ-4 electrochemical sensors — detects combustibles, VOCs, methane, CO
- FLIR Lepton 3.5 thermal camera — finds heat signatures from leaks and overheating equipment
- 40 kHz MEMS microphone array — detects the acoustic signature of pressurised gas escaping a crack
- NVIDIA Jetson Orin NX running the AI pipeline (ROS 2 + PINN inference)
- Pixhawk 6C flight controller running ArduPilot — completely independent from the AI layer

The airframe uses a CNC-machined 7075 aluminium centre hub and hollow carbon fibre arms. The sensor payload sits in a 3D-printed vibration-isolated bracket underneath the body.

### The AI Stack

The core intelligence is a Physics-Informed Neural Network trained to solve the Navier-Stokes equations and advection-diffusion transport simultaneously. In plain terms: the network doesn't just classify a sensor reading as "high" or "low" — it builds a full 3D map of how gas is flowing through the space and traces it back to the source.

The sensors are unreliable on their own. Electrochemical sensors drift with temperature and humidity changes, triggering false alarms constantly. We fixed this using SINDy (Sparse Identification of Nonlinear Dynamics) — a technique that discovers the mathematical equation governing sensor drift from real data, then subtracts it out before anything goes into the neural network. This reduced false positives by 85% in simulation.

The PINN is compiled to a TensorRT engine for deployment on the Jetson. It runs at 0.94 ms per inference — fast enough to update the drone's flight commands in real time at 30 Hz.

When the AI encounters a physical situation beyond its training (violent high-pressure ruptures, multiphase flow events), it recognises its own uncertainty via a residual threshold check and offloads the problem to a base station over ZeroMQ — a high-performance messaging library. The base station returns a flight directive within 20 ms. The drone never stops flying during this.

### The Dashboard

The browser dashboard runs on React + Vite with a 3D WebGL scene (React Three Fiber). It shows:

- **Spatial Twin** — a 3D model of the industrial plant with the actual drone flying through it, animated rotor discs, a scan cone that changes colour with the active mission mode, and a gas leak haze that grows and contracts with the detected concentration
- **Flight Controls** — WASD for horizontal movement, F to go up, C to go down. Works both via keyboard and on-screen buttons. The drone in the 3D view responds instantly
- **Threat Log** — identifies the gas species (Methane, H₂S, VOC, Carbon Monoxide), shows the regulatory limit exceedance, calculates the financial penalty in USD/hr based on EPA Clean Air Act rates, and logs timestamped events
- **System Diagnostics** — shows which infrastructure components are online (telemetry bridge, PINN kernel, SCADA gateway, ROS 2 DDS), plus live PINN kernel metrics, and a rolling system log
- **Mission Control** — four selectable inspection modes (Gas Tomography, Thermal IR Scan, Acoustic Inspection, LiDAR Mapping), each changing how the drone prioritises its sensors
- **Drone Specs** — full technical specification in a tabbed layout covering airframe, propulsion, sensors, and the AI system
- **SCADA Controls** — four plant shutdown commands (Valve Lock, Purge Gas Line, Depressurize, Emergency Shutdown) with a two-tap confirmation to prevent accidental execution

All designed strictly monochrome — no emojis, no placeholder data, no coloured accents. Looks like an Apple product built for an oil refinery.

### The ROS 2 Workspace

Six ROS 2 packages, all building cleanly with colcon build:

| Package                  | What it does                                               |
| ------------------------ | ---------------------------------------------------------- |
| vectorsense_intelligence | PINN inference, SINDy calibration, brain coordination node |
| vectorsense_vision       | Thermal optical flow, FLIR processing                      |
| vectorsense_safety       | 10 Hz heartbeat watchdog, emergency RTL trigger            |
| vectorsense_bridge       | ZMQ telemetry relay, WebSocket hub (port 8188)             |
| vectorsense_drone_sim    | Gazebo world files, launch configurations                  |
| vectorsense_description  | URDF hexacopter model — 6 rotors, correct geometry         |

### Code Files Worth Looking At

- `physics_engine_pinn.py` — the full PINN: network architecture, Navier-Stokes residuals, advection-diffusion loss, training loop with FP16 mixed precision
- `financial_physics_bridge.py` — the WebSocket bridge: autonomous demo trajectory, WASD manual override, SCADA command forwarding
- `sindy_calibration.py` — sensor drift identification and correction
- `sensor_sim.py` — simulated sensor readings from drone position (gas concentration increases near the defined leak source)
- `vectorsense_dashboard/src/App.jsx` — all dashboard state management, keyboard controls, WebSocket connection
- `vectorsense_dashboard/src/components/SpatialTwin.jsx` — the full 3D scene

## What Did Not Work (and Why)

This section is here because honest documentation is more useful than a polished story.

### Gazebo Rendering in the Browser (noVNC)

The original plan was to stream the Gazebo simulation directly to the dashboard via VNC. The Gazebo simulation runs in WSL2 (Windows Subsystem for Linux), and noVNC was supposed to forward the display to the browser.

**What happened:** WSL2's GPU hardware acceleration for OpenGL applications was not stable. The VNC connection established fine at the network level, but Gazebo either refused to open its render window or produced a black frame. This is a known WSL2 limitation with d3d12 DRI driver compatibility for heavy OpenGL workloads.

**What we did instead:** Replaced the Gazebo stream with a full WebGL reimplementation in the browser itself — the SpatialTwin.jsx component. This turned out to be a better demo tool because it responds to live telemetry, is controllable with WASD, and runs on any machine without needing a Linux GPU environment.

The Gazebo world files and launch scripts are complete and work correctly on a native Ubuntu machine with a physical GPU.

### WebSocket Connection Stability

The connection between financial_physics_bridge.py and the React dashboard occasionally drops when the development machine is under high CPU load. The dashboard handles this with an internal simulation fallback — position and sensor data continue updating from local state — but when the bridge is offline, the telemetry shown is simulated, not live.

This is an engineering issue (async reconnection logic) rather than a system design flaw. The fix is straightforward but wasn't prioritised over feature completeness.

### PINN Training Data Source

The PINN was trained on synthetic collocation points — coordinates sampled probabilistically across the domain — rather than from a real OpenFOAM CFD solver. The physics loss formulation is genuine and the convergence is real, but the network has not been validated against ground-truth fluid simulation. This is the correct first step; the OpenFOAM integration is documented below as the next development priority.

### Physical Flight

The system was not flown. ArduPilot SITL (software-in-the-loop) was used to validate the MAVROS command pipeline. The URDF model, ESC parameters, and MAVROS configuration are all correctly specified, but physical integration with the Pixhawk was not completed within the internship window.

### Jetson VRAM Calibration

The VRAM fraction lock (torch.cuda.set_per_process_memory_fraction(0.58)) was tuned for an RTX 4050 Laptop GPU (6 GB GDDR6). The Jetson Orin NX uses shared LPDDR5X memory with a fundamentally different allocation model. This value needs re-calibration on the physical device.

## How the Physics Works (The Short Version)

Gas doesn't just sit where it leaks. It gets carried by wind (advection) and spreads outward on its own (diffusion). Standard threshold sensors can't tell you where gas is coming from — they only tell you it's there.

The PINN learns the fluid dynamics of the air inside the sensing volume. It's a neural network that must satisfy the Navier-Stokes fluid equations at every prediction it makes — not just match the sensor data. This means even in gaps between sensor readings, the concentration field it produces is physically consistent. You can ask it "where is the peak concentration?" and it gives you a source location, not just a reading at the drone's current position.

On top of this, the SINDy calibrator finds the equation that describes how each electrochemical sensor drifts with temperature and humidity, then subtracts out that noise before the readings go into the PINN. Without this step, the network would be trying to model noise instead of gas.

The result: the system can identify the gas species (methane, H₂S, VOC, CO), estimate how far the concentration exceeds the regulatory limit, calculate the financial penalty accumulating per hour, and give the drone a flight vector pointing toward the source — all in under 15 ms.

## System Architecture

```
Drone Body
  ├── MQ-2 / MQ-135 / MQ-4 (gas sensors)
  ├── FLIR Lepton 3.5 (thermal camera)
  ├── MEMS ultrasonic array
  ├── BMI088 IMU + M8N GPS
  │
  └── Jetson Orin NX
        ├── SINDy drift correction
        ├── PINN inference (TensorRT FP16, 0.94 ms)
        ├── Gas classifier + regulatory risk calc
        ├── Residual monitor (6-Sigma fallback trigger)
        ├── ROS 2 Humble DDS
        └── MAVROS → Pixhawk 6C → 6x motors

Base Station (RTX 4050 laptop)
  ├── financial_physics_bridge.py (ws://localhost:8188)
  │     ├── Autonomous demo trajectory
  │     ├── WASD manual override
  │     └── ZMQ fallback CFD solver
  │
  └── React Dashboard (http://localhost:5173)
        ├── 3D Spatial Twin (WebGL)
        ├── Flight controls (WASD / F / C)
        ├── Gas analysis (Threat Log)
        ├── Infrastructure status (System Diagnostics)
        ├── Mission mode selector
        └── SCADA commands
```

## Hardware

| Part              | Spec                                              |
| ----------------- | ------------------------------------------------- |
| Frame             | 550 mm hexacopter, 7075-T6 Al hub, CFRP arms      |
| Compute           | NVIDIA Jetson Orin NX 16 GB                       |
| Flight Controller | Pixhawk 6C + M8N GPS/RTK                          |
| Motors            | 6× T-Motor MN4114 340KV                           |
| ESCs              | 20A, BLHeli_32                                    |
| Battery           | 6S 10,000 mAh LiPo (~28 min endurance)            |
| Thermal           | FLIR Lepton 3.5 on PureThermal 2 board            |
| Gas sensors       | MQ-2 (combustibles), MQ-135 (VOC/CO₂), MQ-4 (CH₄) |
| Acoustic          | 40 kHz piezo MEMS microphone array                |
| IMU               | BMI088 6-axis                                     |
| Telemetry         | Herelink Blue 2.4/5.8 GHz                         |

## Software Stack

| Layer              | What we used                                  |
| ------------------ | --------------------------------------------- |
| Middleware         | ROS 2 Humble + FastRTPS DDS                   |
| Flight interface   | MAVROS 2.x, 921600 baud serial                |
| AI framework       | PyTorch 2.0 + CUDA 12.1                       |
| Inference runtime  | NVIDIA TensorRT 8.6 (FP16)                    |
| Sensor calibration | PySINDy with STLSQ optimizer                  |
| Messaging          | ZeroMQ DEALER/ROUTER pattern                  |
| Serialisation      | MessagePack + LZ4 (~2 KB per telemetry frame) |
| SCADA interface    | OPC-UA over TLS 1.3 / AES-256-GCM             |
| Simulation         | Gazebo Harmonic + ros_gz_sim bridge           |
| Frontend           | React 18 + Vite + React Three Fiber           |
| WebSocket hub      | Python asyncio + websockets (port 8188)       |
| Containers         | Docker + nvidia-container-toolkit             |

## Build and Run

### Requirements

- Ubuntu 22.04 LTS (native preferred; WSL2 works for dashboard and bridge, not for Gazebo render)
- NVIDIA driver ≥ 535
- CUDA 12.1
- Node.js 20 LTS
- Python 3.10+
- Git LFS (needed to download the demo video)

```bash
sudo apt-get update && sudo apt-get install -y \
    python3-pip python3-venv cmake libzmq3-dev build-essential curl

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 1. Clone

```bash
git clone https://github.com/SourishSenapati/VECTORSENSE.git
cd VECTORSENSE
git lfs install
git lfs pull   # downloads demo video.mp4
```

### 2. Build the ROS 2 Workspace

```bash
# Install ROS 2 Humble
sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key \
    -o /usr/share/keyrings/ros-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] \
    http://packages.ros.org/ros2/ubuntu jammy main" \
    | sudo tee /etc/apt/sources.list.d/ros2.list
sudo apt update && sudo apt install -y \
    ros-humble-desktop python3-colcon-common-extensions \
    ros-humble-mavros ros-humble-mavros-extras ros-humble-ros-gz-sim

sudo /opt/ros/humble/lib/mavros/install_geographiclib_datasets.sh

source /opt/ros/humble/setup.bash
cd vectorsense_ws
colcon build --symlink-install
source install/setup.bash
```

**Expected:** Summary: 6 packages finished

### 3. Python Environment + Backend Bridge

```bash
python3 -m venv vectorsense_env
source vectorsense_env/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install websockets pysindy msgpack lz4 pyzmq numpy opcua

# Start the WebSocket bridge (runs demo + accepts WASD overrides)
python vectorsense_ws/src/vectorsense_intelligence/scripts/financial_physics_bridge.py
# Listening on ws://0.0.0.0:8188
```

### 4. React Dashboard

```bash
cd vectorsense_dashboard
npm install
npm run dev
# Open http://localhost:5173
```

### 5. Full Stack — Docker (easier)

```bash
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
docker-compose up --build
# Dashboard → http://localhost:5173
# Bridge   → ws://localhost:8188
```

### 6. Train the PINN (optional — weights included)

```bash
source vectorsense_env/bin/activate
python physics_engine_pinn.py \
    --epochs 5000 --lr 1e-3 --precision fp16 \
    --output ./weights/vectorsense_pinn_fp16.pt
# Converges to residual < 1e-6 in ~1.25 minutes on RTX 4050
```

### 7. Compile TensorRT Engine (for Jetson deployment)

```bash
# Export to ONNX first
python vectorsense_ws/src/vectorsense_intelligence/scripts/export_onnx.py \
    --weights ./weights/vectorsense_pinn_fp16.pt \
    --output ./weights/vectorsense_pinn.onnx

# Compile
trtexec \
    --onnx=./weights/vectorsense_pinn.onnx \
    --saveEngine=./weights/vectorsense.trt \
    --fp16 --workspace=2048
# Result: 12.24 MB, 1063 inferences/sec, 0.94 ms latency
```

### 8. Simulation Only (Native Ubuntu with GPU)

```bash
source /opt/ros/humble/setup.bash
source vectorsense_ws/install/setup.bash
ros2 launch vectorsense_gazebo vectorsense_full_demo.launch.py
```

Not supported under WSL2 — see §"What Did Not Work".

## Using the Dashboard

1. Start the bridge (financial_physics_bridge.py)
2. Start the dashboard (npm run dev)
3. Open http://localhost:5173 — the system initialises automatically

**Flight controls:**

- W / S — forward / backward
- A / D — strafe left / right
- F — altitude up
- C — altitude down

Manual override lasts 3 seconds, then the drone resumes its autonomous inspection loop

**Switching modes:** Click any mode in Mission Control on the left sidebar. The scan cone colour in the 3D view changes immediately.

**Reading the Threat Log:** Gas type is identified from concentration + drone position. If concentration is above the regulatory limit, the Leak Status turns red and financial exposure is calculated live.

**SCADA commands:** First click arms the button (it shows "Confirm?"). Second click within 3 seconds executes. This is intentional — prevents accidental plant shutdowns.

**Hiding controls:** "Hide Controls" button in the header clears the flight pad from the 3D view for a clean look during demonstrations.

## How the PINN Was Trained

The PINN is an 8-layer, 256-neuron neural network. It takes a position and time (x, y, z, t) as input and predicts the wind velocity, pressure, and gas concentration at that point.

**What makes it physics-informed:** the training loss includes penalty terms for violating the Navier-Stokes momentum equations, the incompressibility condition, and the advection-diffusion transport equation. The network is penalised whenever its predictions would require gas to move through a solid wall, or for wind to appear from nowhere.

Training ran for 5,000 iterations on an RTX 4050 Laptop GPU in FP16 mixed precision. It took 1.25 minutes to converge to a PDE residual of 9.87e-7. The trained weights are then exported to ONNX and compiled to a TensorRT engine for edge deployment.

The SINDy calibration step runs before training. It fits a sparse polynomial equation to the sensor drift data (temperature and humidity inputs → error output). Only the terms that genuinely matter statistically survive the thresholding — the rest are zeroed out. This equation is baked into the data preprocessing pipeline so every reading that goes into the PINN is already corrected.

## Performance Numbers

| What                             | Result                               |
| -------------------------------- | ------------------------------------ |
| PINN training time               | 1.25 minutes (RTX 4050, FP16)        |
| PINN PDE residual at convergence | 9.87 × 10⁻⁷                          |
| TensorRT inference latency       | 0.94 ms average                      |
| TensorRT throughput              | 1,063 inferences / second            |
| Engine size on disk              | 12.24 MB                             |
| SINDy calibration fit (R²)       | 0.9882 (13,000 samples)              |
| False positive reduction         | 85% (in simulation, humidity-driven) |
| End-to-end loop latency          | 14.1 ms (sensor → MAVROS setpoint)   |
| Base station fallback round-trip | < 20 ms over LAN                     |

## Safety Design

The flight controller (Pixhawk) is completely separate from the AI processor (Jetson). If the AI crashes, the flight controller keeps flying. If the connection breaks, it returns to launch automatically.

The watchdog node in vectorsense_safety pings the PINN inference node at 10 Hz. If the response is absent for more than 500 ms, it tells the Pixhawk to return home immediately — before any human has even noticed a problem.

When the PINN's physics residual spikes above its confidence threshold, it doesn't guess. It freezes the flight command, calls the base station, gets a better answer, and continues. This asymmetric fallback means the system degrades gracefully instead of failing catastrophically.

Battery and wind limits are handled at the ArduPilot level, independent of everything else. Below 14.8 V on the 6S pack, it comes home. Above 12 m/s wind, the position hold activates.

## Known Limitations

- **WSL2 Gazebo:** The Gazebo simulation cannot render in a browser via noVNC from WSL2 due to GPU driver limitations. The WebGL dashboard is the working demo interface.
- **WebSocket drops:** The bridge connection can drop under CPU load. The dashboard falls back to local simulation automatically.
- **PINN trained on synthetic data:** Not validated against real OpenFOAM CFD output yet. Physics loss formulation is correct; training data is the gap.
- **No physical flight:** MAVROS tested in SITL only. Hardware integration not completed during internship period.
- **Jetson VRAM clamp:** The 0.58 memory fraction was calibrated on an RTX 4050, not a Jetson Orin. Needs re-tuning on physical hardware.

## What Comes Next

### Immediate (before physical deployment):

- Connect OpenFOAM CFD output as PINN training data instead of synthetic points
- Complete physical Pixhawk integration and benchtop MAVROS validation
- Recalibrate VRAM fraction on Jetson Orin NX hardware
- Harden WebSocket reconnection in the bridge

### Near-term extensions:

- **Multi-species gas detection:** track CH₄, H₂S, CO, and VOC simultaneously as separate concentration fields powered by coupled transport equations
- **Second drone:** implement the distributed potential field algorithm so two drones cooperate to localise a source twice as fast
- **Bayesian uncertainty:** wrap the PINN in a Monte Carlo Dropout layer to produce confidence intervals instead of point estimates — required for formal regulatory certification

### Longer-term:

- **Real-time plant CAD ingestion from CMMS:** automatically update the physics domain when valves open and close without retraining
- **Multiphase flow:** extend PINN to handle steam leaks and LPG flashing (liquid-to-gas transition), not just gas-phase dispersion
- **Neuromorphic inference:** evaluate Intel Loihi 2 as a lower-power alternative to the Jetson for PINN inference — relevant for extending flight endurance

## Troubleshooting

| Problem                               | Cause                    | Fix                                                     |
| ------------------------------------- | ------------------------ | ------------------------------------------------------- |
| Dashboard shows "Connection: Offline" | Bridge not running       | Start financial_physics_bridge.py on port 8188          |
| Drone frozen in 3D view               | WebSocket dropped        | Refresh page; bridge reconnects automatically           |
| Gas always reads 0.000 ppm            | Sensor sim not started   | Run sensor_sim.py or connect hardware                   |
| PINN residual stuck high              | Bad collocation sampling | Increase collocation points; check domain bounds        |
| Gazebo blank screen                   | WSL2 / OpenGL issue      | Use native Ubuntu with physical GPU                     |
| colcon build fails                    | Missing ros_gz_sim       | sudo apt install ros-humble-ros-gz-sim                  |
| TRT engine fails on Jetson            | CUDA version mismatch    | Compile TRT engine natively on Jetson                   |
| Demo video won't download             | Git LFS not configured   | Run git lfs install && git lfs pull                     |
| Training OOM                          | VRAM not clamped         | Add torch.cuda.set_per_process_memory_fraction(0.58, 0) |

## File Structure

```
VECTORSENSE/
├── vectorsense_dashboard/          # React frontend
│   └── src/
│       ├── App.jsx                 # All state, WebSocket, keyboard controls
│       ├── App.css                 # Design system (CSS variables)
│       └── components/
│           ├── SpatialTwin.jsx     # 3D WebGL scene
│           ├── MissionControl.jsx  # Protocol selector
│           ├── MitigationControl.jsx # SCADA commands
│           ├── ThreatEconomics.jsx # Gas analysis + risk
│           ├── SystemDiagnostics.jsx # Infrastructure status
│           └── DroneSpecs.jsx      # Technical spec panel
├── vectorsense_ws/                 # ROS 2 workspace
│   └── src/
│       ├── vectorsense_intelligence/
│       │   └── scripts/
│       │       ├── financial_physics_bridge.py  # WebSocket hub
│       │       ├── sensor_sim.py                # Simulated sensors
│       │       ├── acoustic_sim.py              # Acoustic simulation
│       │       └── edge_fallback_test.py        # 6-Sigma test
│       ├── vectorsense_drone_sim/  # Gazebo worlds + launch
│       ├── vectorsense_bridge/     # ZMQ telemetry relay
│       └── vectorsense_description/ # URDF model
├── physics_engine_pinn.py          # PINN training script
├── sindy_calibration.py            # Sensor drift correction
├── scada_network_sim.py            # SCADA simulation layer
├── Dockerfile                      # Container definition
├── docker-compose.yml              # Full stack orchestration
├── launch_sim_windows.ps1          # Windows one-command startup
├── demo video.mp4                  # Demo recording (via Git LFS)
└── README.md                       # This file
```

## References

1. Raissi, M., Perdikaris, P., & Karniadakis, G. E. (2019). Physics-informed neural networks. Journal of Computational Physics, 378, 686–707.
2. Brunton, S. L., Proctor, J. L., & Kutz, J. N. (2016). Discovering governing equations from data by sparse identification. PNAS, 113(15).
3. Vergara, A., et al. (2012). Chemical gas sensor drift compensation using classifier ensembles. Sensors and Actuators B: Chemical.
4. NVIDIA Corporation (2023). TensorRT Developer Guide v8.6.
5. OpenFOAM Foundation (2023). OpenFOAM v10 User Guide.

---

Final project — SURE ProEd SURE TRUST G5 Robotics Internship  
Sourish Senapati | https://github.com/SourishSenapati/VECTORSENSE
