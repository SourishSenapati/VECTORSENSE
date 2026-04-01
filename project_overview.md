# Project Overview: VectorSense Ghost

This document provides a high-level summary of the VectorSense Ghost Autonomous Flight system.

## 1. Project Objective

VectorSense is a sub-10ms autonomous flight and discrepancy detection system designed for high-risk industrial environments (e.g., refineries). It uses Physics-Informed Neural Networks (PINNs) to compare real-world (or Gazebo-simulated) telemetry with ideal physical models to detect anomalies like gas leaks or structural failures.

## 2. System Architecture

The system employs a "Ghost Core" architecture across two operating systems:

### A. WSL (Ubuntu 24.04 - Noble Numbat)

- **Framework**: ROS 2 (Jazzy)
- **Physics Simulator**: Gazebo (Harmonic)
- **Autonomous Commander**: Python-based APF (Artificial Potential Field) controller.
- **Bridge**: `gazebo_zmq_bridge` (using LZ4 compression).

### B. Windows 11

- **Physics Kernel**: `physics_engine_pinn.py` (via PyTorch/CUDA).
- **Network Sim**: SCADA/IoT bridge.
- **Data Broker**: `financial_physics_bridge.py` (via ZeroMQ & WebSockets).
- **GUI Engine**: React/Three.js dashboard (Vite).

## 3. Communication Stack

- **ZMQ (ZeroMQ)**: High-speed asynchronous IPC for telemetry data.
- **LZ4**: Micro-compression for sub-10ms packet delivery across the WSL boundary.
- **WebSockets**: Real-time browser-based visualization on port 8000.
- **PINN (Physics-Informed Neural Networks)**: Used for calculating Navier-Stokes residuals for fluid dynamics anomaly detection.

## 4. Hardware/Simulation Specs

- **Drone Model**: VectorSense Ghost (Xacro-based URDF).
- **Environment**: Jamnagar Refinery Emulation.
- **Sensory Feed**: Real-time odometry, twist, and digital SCADA pressure readings.
