import torch
import sys

# Restriction to mimic Jetson Nano constraints (Directive 1.2)
# 4GB Jetson shared mem target -> 3.5GB used on 6GB RTX 4050
# 3.5 / 6.0 = 0.5833
# The directive asks for exact torch.cuda.set_per_process_memory_fraction(0.58, 0)
torch.cuda.set_per_process_memory_fraction(0.58, 0) 
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def vram_test():
    print(f"CUDA Device: {torch.cuda.get_device_name(0)}")
    print(f"Memory Fraction set to: 0.58 (approx 3.5GB on a 6GB card)")
    
    # Try to allocate a large tensor (e.g. 4GB) which should exceed the fraction
    # 1024^3 float32 = 4GB
    # RTX 4050 has 6GB. Total limit is 6 * 0.58 = 3.48 GB. 
    # An allocation of 4GB should trigger OOM.
    
    try:
        print("Attempting to allocate a tensor that exceeds the 3.5GB cap...")
        # 1024^3 * 4 / (1024^3) = 4GB
        # (1024, 1024, 1024) float32 = 4GB
        size = (1024, 1024, 1024) 
        x = torch.zeros(size, device=device)
        print("CRITICAL FAILURE: Memory clamp did NOT work. Allocated 4GB successfully.")
    except torch.cuda.OutOfMemoryError as e:
        print(f"SUCCESS: Out-Of-Memory error triggered as expected.")
        print(f"Error Message: {e}")
    except RuntimeError as e:
        print(f"SUCCESS (RuntimeError): Out-Of-Memory or allocation error triggered as expected.")
        print(f"Error Message: {e}")

if __name__ == "__main__":
    vram_test()
