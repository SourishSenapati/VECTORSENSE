import pysindy as ps
import numpy as np
import pandas as pd
import os
import sys

"""
VectorSense SINDy Calibration Executive.
Utilizes Sparse Identification of Nonlinear Dynamics to discover the 
governing equations of sensor drift using empirical UCI datasets.
"""

def generate_synthetic_drift_data(n_samples=5000):
    """
    Generate synthetic industrial drift data to mimic UCI Gas Sensor Array 
    if the local filesystem lacks the raw CSV.
    """
    t = np.linspace(0, 100, n_samples)
    T = 25 + 5 * np.sin(t / 10)  # Temperature oscillation
    H = 50 + 10 * np.cos(t / 5)   # Humidity oscillation
    
    # Non-linear drift model: Offset + T dependence + T^2 + noise
    drift = -0.5 + 0.04*T - 0.01*H + 0.002*(T**2) + np.random.normal(0, 0.01, n_samples)
    
    return np.stack([t, T, H], axis=1), drift.reshape(-1, 1)

def run_sindy_calibration(data_csv=None):
    print("[INIT] Starting SINDy Sparse Discovery Engine.")
    
    if data_csv and os.path.exists(data_csv):
        # Industrial Data Ingestion
        df = pd.read_csv(data_csv)
        X = df[['time', 'temp', 'humidity']].values
        y = df['voltage_drift'].values.reshape(-1, 1)
    else:
        print("[WARN] Industrial dataset not found. Utilizing Synthetic Emulation Bank.")
        X, y = generate_synthetic_drift_data()

    # 1. Define the Feature Library (3rd Degree Polynomial)
    # Allows for T^3, H^3, T*H, T^2*H interactions
    poly_library = ps.PolynomialLibrary(degree=3)
    
    # 2. Define the Optimizer (Sequentially Thresholded Least Squares)
    # Aggressively strips away noise with a 0.1 sparsity threshold
    optimizer = ps.STLSQ(threshold=0.1)
    
    # 3. Model Initialization
    model = ps.SINDy(
        feature_library=poly_library,
        optimizer=optimizer,
        feature_names=["t", "T", "H"]
    )
    
    # 4. Global Fit Execution
    model.fit(X, y, quiet=True)
    
    # 5. Result Extraction
    print("\n[DISCOVERED] Governing Drift Equation:")
    model.print()
    
    # Coefficients for the brain_node.py rectification layer
    coeffs = model.coefficients()
    print(f"\n[READY] Extracted {len(coeffs[coeffs != 0])} sparse physical constants.")
    
    return model

if __name__ == "__main__":
    run_sindy_calibration()
