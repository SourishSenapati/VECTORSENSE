import torch
import torch.nn as nn
import numpy as np

"""
VectorSense Physics-Informed Neural Network (PINN) Core Module.
This module defines the neural architecture and the governing physical residuals 
for 3D (x, y, t) fluid dynamics, focusing on the Navier-Stokes and Advection-Diffusion 
equations to enable high-precision toxic plume localization.
"""

class VectorSensePINN(nn.Module):
    def __init__(self, hidden_layers=6, neurons_per_layer=256):
        """
        Initialize the PINN architecture.
        
        Args:
            hidden_layers (int): The number of fully connected hidden layers.
            neurons_per_layer (int): Nodes per hidden layer.
        """
        super(VectorSensePINN, self).__init__()
        
        # Deep Neural Architecture for high-fidelity PDE resolution
        layers = []
        # Input: x (spatial), y (spatial), t (temporal)
        layers.append(nn.Linear(3, neurons_per_layer))
        layers.append(nn.Tanh())
        
        for _ in range(hidden_layers - 1):
            layers.append(nn.Linear(neurons_per_layer, neurons_per_layer))
            layers.append(nn.Tanh())
            
        # Output: u (velocity-x), v (velocity-y), P (Pressure), C (Concentration)
        layers.append(nn.Linear(neurons_per_layer, 4))
        
        self.net = nn.Sequential(*layers)
        
        # Physical Parameters (Default industrial settings for air at 25C)
        self.nu = nn.Parameter(torch.tensor([0.01]), requires_grad=False)   # Kinematic Viscosity
        self.rho = nn.Parameter(torch.tensor([1.225]), requires_grad=False) # Air Density (kg/m^3)
        self.D = nn.Parameter(torch.tensor([0.05]), requires_grad=False)    # Diffusion Coefficient
        
        # Scaling factors for normalization
        self.L_ref = 1.0  # Reference length (meters)
        self.U_ref = 1.0  # Reference velocity (m/s)
        self.C_ref = 1.0  # Reference concentration
        
    def forward(self, x, y, t):
        """
        Forward pass of the neural network.
        
        Args:
            x, y, t: Tensors of shape (batch_size, 1)
            
        Returns:
            Tensor of shape (batch_size, 4) containing [u, v, P, C]
        """
        inputs = torch.cat([x, y, t], dim=1)
        return self.net(inputs)

    def calculate_derivatives(self, x, y, t, u, v, P, C):
        """
        Compute spatio-temporal derivatives using automatic differentiation.
        
        Returns a dictionary of first and second order derivatives.
        """
        # 1st order temporal
        u_t = torch.autograd.grad(u, t, grad_outputs=torch.ones_like(u), create_graph=True, retain_graph=True)[0]
        v_t = torch.autograd.grad(v, t, grad_outputs=torch.ones_like(v), create_graph=True, retain_graph=True)[0]
        C_t = torch.autograd.grad(C, t, grad_outputs=torch.ones_like(C), create_graph=True, retain_graph=True)[0]
        
        # 1st order spatial
        u_x = torch.autograd.grad(u, x, grad_outputs=torch.ones_like(u), create_graph=True, retain_graph=True)[0]
        u_y = torch.autograd.grad(u, y, grad_outputs=torch.ones_like(u), create_graph=True, retain_graph=True)[0]
        
        v_x = torch.autograd.grad(v, x, grad_outputs=torch.ones_like(v), create_graph=True, retain_graph=True)[0]
        v_y = torch.autograd.grad(v, y, grad_outputs=torch.ones_like(v), create_graph=True, retain_graph=True)[0]
        
        P_x = torch.autograd.grad(P, x, grad_outputs=torch.ones_like(P), create_graph=True, retain_graph=True)[0]
        P_y = torch.autograd.grad(P, y, grad_outputs=torch.ones_like(P), create_graph=True, retain_graph=True)[0]
        
        C_x = torch.autograd.grad(C, x, grad_outputs=torch.ones_like(C), create_graph=True, retain_graph=True)[0]
        C_y = torch.autograd.grad(C, y, grad_outputs=torch.ones_like(C), create_graph=True, retain_graph=True)[0]
        
        # 2nd order spatial (Laplacian components)
        u_xx = torch.autograd.grad(u_x, x, grad_outputs=torch.ones_like(u_x), create_graph=True, retain_graph=True)[0]
        u_yy = torch.autograd.grad(u_y, y, grad_outputs=torch.ones_like(u_y), create_graph=True, retain_graph=True)[0]
        
        v_xx = torch.autograd.grad(v_x, x, grad_outputs=torch.ones_like(v_x), create_graph=True, retain_graph=True)[0]
        v_yy = torch.autograd.grad(v_y, y, grad_outputs=torch.ones_like(v_y), create_graph=True, retain_graph=True)[0]
        
        C_xx = torch.autograd.grad(C_x, x, grad_outputs=torch.ones_like(C_x), create_graph=True, retain_graph=True)[0]
        C_yy = torch.autograd.grad(C_y, y, grad_outputs=torch.ones_like(C_y), create_graph=True, retain_graph=True)[0]
        
        return {
            'u_t': u_t, 'v_t': v_t, 'C_t': C_t,
            'u_x': u_x, 'u_y': u_y, 'v_x': v_x, 'v_y': v_y,
            'P_x': P_x, 'P_y': P_y, 'C_x': C_x, 'C_y': C_y,
            'u_xx': u_xx, 'u_yy': u_yy, 'v_xx': v_xx, 'v_yy': v_yy,
            'C_xx': C_xx, 'C_yy': C_yy
        }

    def compute_physics_loss(self, x, y, t):
        """
        Calculate the residual of the governing physical laws.
        
        Enforces:
        1. Incompressible Navier-Stokes (X-Momentum)
        2. Incompressible Navier-Stokes (Y-Momentum)
        3. Continuity Equation (Mass Conservation)
        4. Advection-Diffusion Equation (Plume Transport)
        """
        # Ensure inputs can propagate gradients
        x.requires_grad_(True)
        y.requires_grad_(True)
        t.requires_grad_(True)
        
        # Network Prediction
        pred = self.forward(x, y, t)
        u, v, P, C = pred[:, 0:1], pred[:, 1:2], pred[:, 2:3], pred[:, 3:4]
        
        # Differentiation
        d = self.calculate_derivatives(x, y, t, u, v, P, C)
        
        # 1. Navigator-Stokes Residuals (Momentum Conservation)
        res_u = d['u_t'] + (u * d['u_x'] + v * d['u_y']) + (1.0/self.rho) * d['P_x'] - self.nu * (d['u_xx'] + d['u_yy'])
        res_v = d['v_t'] + (u * d['v_x'] + v * d['v_y']) + (1.0/self.rho) * d['P_y'] - self.nu * (d['v_xx'] + d['v_yy'])
        
        # 2. Continuity Equation (Incompressibility)
        res_mass = d['u_x'] + d['v_y']
        
        # 3. Advection-Diffusion Equation (Chemical Transport)
        # Accounts for wind transport (Advection) and probabilistic spread (Diffusion)
        res_C = d['C_t'] + (u * d['C_x'] + v * d['C_y']) - self.D * (d['C_xx'] + d['C_yy'])
        
        # Loss aggregation using Mean Squared Error of the residuals
        loss_u = torch.mean(res_u**2)
        loss_v = torch.mean(res_v**2)
        loss_mass = torch.mean(res_mass**2)
        loss_C = torch.mean(res_C**2)
        
        return loss_u + loss_v + loss_mass + loss_C

def apply_vram_clamp(fraction=0.58):
    """
    Enforce VRAM hardware limits for NVIDIA Jetson deployment compatibility.
    """
    if torch.cuda.is_available():
        torch.cuda.set_per_process_memory_fraction(fraction, 0)
        print(f"[NOMINAL] Memory resource ceiling established at {fraction*100:.1f}% of GPU capacity.")
    else:
        print("[WARNING] CUDA device not detected. Local CPU execution active.")

def validate_dimensions(model, device):
    """
    Sanity check for the computational graph.
    """
    x = torch.randn(1, 1).to(device)
    y = torch.randn(1, 1).to(device)
    t = torch.randn(1, 1).to(device)
    out = model(x, y, t)
    assert out.shape == (1, 4), f"Dimension mismatch: {out.shape}"
    print("[SUCCESS] Model architectural dimensions verified.")
