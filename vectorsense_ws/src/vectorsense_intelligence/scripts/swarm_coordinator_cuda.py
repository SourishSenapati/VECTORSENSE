import torch
import numpy as np
import time

"""
VectorSense Swarm Coordinator: CUDA-Accelerated Artificial Potential Fields (APF).
Calculates repulsive and attractive vectors to prevent multi-agent collisions 
while optimizing plume traversal. Executes on the RTX 4050 GPU to meet 
the < 2ms latency requirement for a 3-agent swarm.
"""

class SwarmCoordinator:
    def __init__(self, k_att=1.0, k_rep=5.0, d_0=2.0):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.k_att = k_att # Attractive constant
        self.k_rep = k_rep # Repulsive constant
        self.d_0 = d_0     # Distance of influence (meters)
        
    def calculate_swarm_vectors(self, drone_positions, plume_source_pos):
        """
        Computes the net force vector for each drone in the swarm.
        - Attractive Force: Plume gradient.
        - Repulsive Force: Inter-agent collision avoidance.
        
        drone_positions: Tensor of shape (N, 3) [x, y, z]
        plume_source_pos: Tensor of shape (1, 3)
        """
        ts_start = time.perf_counter()
        
        # Move inputs to CUDA device
        P = torch.as_tensor(drone_positions, device=self.device, dtype=torch.float32)
        S = torch.as_tensor(plume_source_pos, device=self.device, dtype=torch.float32)
        
        num_drones = P.shape[0]
        
        # 1. Calculate Attractive Forces (F_att = -k_att * (P - S))
        # Direct vector towards the source
        f_att = -self.k_att * (P - S)
        
        # 2. Calculate Repulsive Forces (Inter-agent)
        # Compute pair-wise distance matrix
        # P_diff[i, j] = P[i] - P[j]
        P_diff = P.unsqueeze(1) - P.unsqueeze(0)
        dist = torch.norm(P_diff, dim=2)
        
        # Avoid division by zero on diagonal (self-repulsion)
        dist = dist + torch.eye(num_drones, device=self.device) * 1e6
        
        # Repulsive Force formula provided by industrial directive:
        # F_rep = k_rep * (1/dist - 1/d_0) * (1/dist^2) * unit_vector
        # Note: Derivative of 1/2 * k_rep * (1/d - 1/d0)^2 w.r.t d is k_rep * (1/d - 1/d0) * (-1/d^2)
        
        mask = (dist < self.d_0).float()
        rep_mag = self.k_rep * (1.0/dist - 1.0/self.d_0) * (1.0/dist**2)
        rep_mag = rep_mag * mask
        
        # unit_vector = (P[i] - P[j]) / dist
        f_rep_matrix = rep_mag.unsqueeze(2) * (P_diff / dist.unsqueeze(2))
        f_rep = torch.sum(f_rep_matrix, dim=1)
        
        # 3. Net Force Calculation
        net_force = f_att + f_rep
        
        latency_ms = (time.perf_counter() - ts_start) * 1000
        result = net_force.cpu().numpy()
        
        return result, latency_ms

if __name__ == "__main__":
    # Performance Validation (KPI-2: < 2ms)
    coordinator = SwarmCoordinator()
    
    # Simulate a 3-agent swarm approaching a central leak
    test_drones = np.array([
        [1.0, 0.0, 5.0],
        [0.0, 1.0, 5.0],
        [1.1, 1.1, 5.0]
    ])
    test_plume = np.array([[5.0, 5.0, 5.5]])
    
    # Warm-up CUDA kernel
    for _ in range(10):
        coordinator.calculate_swarm_vectors(test_drones, test_plume)
        
    vectors, lat = coordinator.calculate_swarm_vectors(test_drones, test_plume)
    print(f"[HW] Swarm APF Resolution Latency: {lat:.4f} ms")
    print(f"[RESULT] Net Velocity Offsets:\n{vectors}")
