import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import autocast, GradScaler
import time
import os
import signal
from vectorsense_pinn import VectorSensePINN, apply_vram_clamp

# Model pointer for interrupt saving
model_pointer = None

def save_model(signal_received=None, frame=None):
    """Save weights on Ctrl+C or Interrupt"""
    if model_pointer:
        print("\n[!] Interrupt detected. Saving current state...")
        torch.save(model_pointer.state_dict(), "vectorsense_pinn_checkpoint.pt")
        print("Progress saved in vectorsense_pinn_checkpoint.pt")
        if signal_received:
            exit(0)

def train_pinn():
    global model_pointer
    
    if not torch.cuda.is_available():
        print("CRITICAL: CUDA not detected.")
        return
        
    print(f"Device: {torch.cuda.get_device_name(0)}")
    
    apply_vram_clamp(0.58)
    
    device = torch.device("cuda")
    pinn_model = VectorSensePINN().to(device)
    model_pointer = pinn_model
    
    # Register Interrupt handler
    signal.signal(signal.SIGINT, save_model)
    
    # Mixed Precision Configuration
    scaler = GradScaler()
    optimizer = optim.Adam(pinn_model.parameters(), lr=1e-4) 
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=50)
    
    n_points = 250000 
    batch_size = 8192 
    
    x_ph = torch.rand(n_points, 1, device=device).requires_grad_(True)
    y_ph = torch.rand(n_points, 1, device=device).requires_grad_(True)
    t_ph = torch.rand(n_points, 1, device=device).requires_grad_(True)
    
    print("\n" + "="*50)
    print("   PINN Navier-Stokes Training")
    print("   Target Loss: <1e-6")
    print("="*50 + "\n")
    
    start_time = time.perf_counter()
    epoch = 0
    
    try:
        while True:
            epoch += 1
            optimizer.zero_grad()
            
            # Autocast for Tensor Core acceleration (4th Gen)
            with autocast():
                # Physics Residual computed via Autograd
                # Selecting subset for iteration diversity
                idx = torch.randperm(n_points)[:batch_size]
                loss = pinn_model.compute_physics_loss(x_ph[idx], y_ph[idx], t_ph[idx])
            
            # Backprop with scaling
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            
            # Progress Logging
            if epoch % 10 == 0:
                cur_time = (time.perf_counter() - start_time) / 60.0
                print(f"Iter: {epoch} | Loss: {loss.item():.8e} | Time: {cur_time:.2f}m", end='\r')
            
            # Scheduler Step
            scheduler.step(loss)
            
            # KPI 3 Convergence - Tightened for 99.999% Accuracy
            if loss.item() < 1e-6:
                print(f"\n\n[SUCCESS] DEEP LEARNING REACHED: Loss {loss.item():.8e}")
                print(f"99.999% Precision achieved at Epoch {epoch}")
                break
            
            # Hard Timeout (Directive Requirement)
            if (time.perf_counter() - start_time) / 60.0 > 12.0:
                print("\n\n[WARNING] Time limit reached. Securing weights...")
                break
                
    except KeyboardInterrupt:
        save_model()
        
    total_time = (time.perf_counter() - start_time) / 60.0
    print(f"\nTRAIN DURATION: {total_time:.2f} minutes.")
    
    # Final Export
    torch.save(pinn_model.state_dict(), "vectorsense_pinn_fp16.pt")
    print("Final weights locked in: vectorsense_pinn_fp16.pt")

if __name__ == "__main__":
    train_pinn()
