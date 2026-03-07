import torch
import torch.nn as nn

class VectorSensePINN(nn.Module):
    def __init__(self):
        super(VectorSensePINN, self).__init__()
        # Deeper network for high accuracy (99.999% target)
        self.net = nn.Sequential(
            nn.Linear(3, 256),
            nn.Tanh(),
            nn.Linear(256, 512),
            nn.Tanh(),
            nn.Linear(512, 512),
            nn.Tanh(),
            nn.Linear(512, 256),
            nn.Tanh(),
            nn.Linear(256, 4) 
        )
        
        # Physics Constants
        self.nu = 0.01   # Viscosity
        self.rho = 1.0   # Density
        self.D = 0.05    # Diffusion
        
    def forward(self, x, y, t):
        inputs = torch.cat([x, y, t], dim=1)
        outputs = self.net(inputs)
        return outputs # (u, v, P, C)

    def compute_physics_loss(self, x, y, t):
        # Enable gradients for inputs
        x.requires_grad_(True)
        y.requires_grad_(True)
        t.requires_grad_(True)
        
        # PINN Output
        outputs = self.forward(x, y, t)
        u = outputs[:, 0:1]
        v = outputs[:, 1:2]
        P = outputs[:, 2:3]
        C = outputs[:, 3:4]
        
        # Auto-Differentiation for Derivatives
        # 1st order
        u_t = torch.autograd.grad(u, t, grad_outputs=torch.ones_like(u), create_graph=True)[0]
        u_x = torch.autograd.grad(u, x, grad_outputs=torch.ones_like(u), create_graph=True)[0]
        u_y = torch.autograd.grad(u, y, grad_outputs=torch.ones_like(u), create_graph=True)[0]
        
        v_t = torch.autograd.grad(v, t, grad_outputs=torch.ones_like(v), create_graph=True)[0]
        v_x = torch.autograd.grad(v, x, grad_outputs=torch.ones_like(v), create_graph=True)[0]
        v_y = torch.autograd.grad(v, y, grad_outputs=torch.ones_like(v), create_graph=True)[0]
        
        P_x = torch.autograd.grad(P, x, grad_outputs=torch.ones_like(P), create_graph=True)[0]
        P_y = torch.autograd.grad(P, y, grad_outputs=torch.ones_like(P), create_graph=True)[0]
        
        C_t = torch.autograd.grad(C, t, grad_outputs=torch.ones_like(C), create_graph=True)[0]
        C_x = torch.autograd.grad(C, x, grad_outputs=torch.ones_like(C), create_graph=True)[0]
        C_y = torch.autograd.grad(C, y, grad_outputs=torch.ones_like(C), create_graph=True)[0]
        
        # 2nd order
        u_xx = torch.autograd.grad(u_x, x, grad_outputs=torch.ones_like(u_x), create_graph=True)[0]
        u_yy = torch.autograd.grad(u_y, y, grad_outputs=torch.ones_like(u_y), create_graph=True)[0]
        
        v_xx = torch.autograd.grad(v_x, x, grad_outputs=torch.ones_like(v_x), create_graph=True)[0]
        v_yy = torch.autograd.grad(v_y, y, grad_outputs=torch.ones_like(v_y), create_graph=True)[0]
        
        C_xx = torch.autograd.grad(C_x, x, grad_outputs=torch.ones_like(C_x), create_graph=True)[0]
        C_yy = torch.autograd.grad(C_y, y, grad_outputs=torch.ones_like(C_y), create_graph=True)[0]
        
        # 1. Navier-Stokes Residuals (x and y)
        res_u = u_t + (u * u_x + v * u_y) + (1.0/self.rho) * P_x - self.nu * (u_xx + u_yy)
        res_v = v_t + (u * v_x + v * v_y) + (1.0/self.rho) * P_y - self.nu * (v_xx + v_yy)
        
        # 2. Continuity Residual (Mass conservation)
        res_mass = u_x + v_y
        
        # 3. Advection-Diffusion Residual (Plume tracking)
        res_C = C_t + (u * C_x + v * C_y) - self.D * (C_xx + C_yy)
        
        # Combined Physics Loss
        loss_pde = torch.mean(res_u**2) + torch.mean(res_v**2) + torch.mean(res_mass**2) + torch.mean(res_C**2)
        return loss_pde

def apply_vram_clamp(fraction=0.58):
    # Directive 1.2: Restrict RTX 4050 to mimic Jetson Nano VRAM constraints
    if torch.cuda.is_available():
        torch.cuda.set_per_process_memory_fraction(fraction, 0)
        print(f"VRAM CLAMP ENABLED: {fraction*100}% allocation limit.")
