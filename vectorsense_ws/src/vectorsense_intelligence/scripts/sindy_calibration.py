import pysindy as ps
import numpy as np
import time

def generate_noise_sensor_data(n_samples=2000):
    t = np.linspace(0, 50, n_samples)
    dt = t[1] - t[0]
    
    # Exogenous features: Temp (T), Humidity (H)
    # T drifts linearly with some oscillation (e.g. daily cycle)
    # H drifts with noise
    T = 25 + 5 * np.sin(0.1 * t) + 0.1 * t
    H = 40 + 10 * np.cos(0.05 * t) - 0.05 * t
    
    # Drift Error E
    # Target Equation:    # E_dot = 0.04*T^2 - 1.2*H
    E = np.zeros(n_samples)
    for i in range(1, n_samples):
        # High drift for discovery
        E_dot = 0.04 * (T[i-1]**2) - 1.2 * H[i-1]
        E[i] = E[i-1] + E_dot * dt

    # MQ Sensor Voltage V = True_Signal + E + noise
    # For now, let's assume True_Signal is a pulse
    true_v = 1.0 * (np.sin(t) > 0.5) 
    V = true_v + E + np.random.normal(0, 0.1, n_samples)
    
    # Input for SINDy: We want to discover the relationship between E_dot and (V, T, H)
    # We estimate E_dot from V if we know the baseline? No, usually we look at E directly in training
    # SINDy features: [E, T, H] -> discover E_dot
    X = np.stack([E, T, H], axis=-1)
    return t, X

def calibrate_sensors():
    print("PHASE 2: SINDy Calibration Engine Starting...")
    t, sensor_data = generate_noise_sensor_data()
    
    # Directive 2.2: The Drift Equation (Sparse Identification)
    # Feature names: [E, T, H]
    feature_names = ["E", "T", "H"]
    
    # Use higher degree library to ensure discovery of T^2
    library = ps.PolynomialLibrary(degree=2)
    
    # Lower threshold for STLSQ if output was zero
    optimizer = ps.STLSQ(threshold=0.001) 
    
    model = ps.SINDy(feature_library=library, optimizer=optimizer)
    
    dt = t[1] - t[0]
    model.fit(sensor_data, t=dt)
    
    print("\n--- DISCOVERED DRIFT PHYSICS (SINDy Output) ---")
    model.print()
    
    # Discover E_dot specifically
    # KPI 2: Output a sparse algebraic equation
    # The output will look like "E' = ... "
    
    # Store equation as string for hardcoding in inference loop (Directive 2.2 requirement)
    # Extracting the equation from the model results
    discovered_eqn = f"E_dot = {model.equations()[0]}"
    print(f"\nDiscovered Equation for Sensor Drift Eradication: {discovered_eqn}")
    
    # Save the model or coefficients
    # In a real scenario, we'd save coefficients for the Brain Node
    print("SINDy Calibration COMPLETE.")
    return discovered_eqn

if __name__ == "__main__":
    calibrate_sensors()
