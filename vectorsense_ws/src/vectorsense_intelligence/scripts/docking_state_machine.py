from enum import IntEnum
import time
import numpy as np

"""
VectorSense Docking State Machine: SINDy Field Calibration Executive.
Manages the transition between operational flight states and ground-truth 
sensor recalibration. Ensures the SINDy drift equation is updated daily 
using a controlled 10ppm gas reference dose.
"""

class MissionState(IntEnum):
    FLIGHT = 0
    LANDED = 1
    DOCK_SEALED = 2
    CALIBRATING = 3

class DockingManager:
    def __init__(self, target_ppm=10.0):
        self.state = MissionState.LANDED
        self.target_ppm = target_ppm
        self.recalibration_verified = False
        self.last_state_change = time.time()

    def update_state(self, is_armed, contact_confirmed):
        """
        Transition logic based on hardware telemetry.
        """
        if self.state == MissionState.FLIGHT and not is_armed:
            self._transition(MissionState.LANDED)
            
        elif self.state == MissionState.LANDED and contact_confirmed:
            self._transition(MissionState.DOCK_SEALED)
            
        elif self.state == MissionState.DOCK_SEALED:
            # Automatic transition to calibration once sealed
            self._transition(MissionState.CALIBRATING)
            
    def _transition(self, new_state):
        print(f"[STATE] Transition: {self.state.name} -> {new_state.name}")
        self.state = new_state
        self.last_state_change = time.time()

    def run_sindy_recalibration(self, sensor_voltages):
        """
        Executes SINDy optimization using the 10ppm reference dose.
        KPI-5: Convergence Verification within +/- 0.5% (0.05 ppm).
        """
        if self.state != MissionState.CALIBRATING:
            return False
            
        print("[DOCK] Initiating 10ppm Micro-Dose Release...")
        time.sleep(1.0) # Simulated gas stabilization
        
        # Simulated SINDy Convergence logic
        # In reality, this calls pysindy.SINDy.fit()
        measured_ppm = np.mean(sensor_voltages) * 1.5 # Simulated mapping
        
        error = abs(measured_ppm - self.target_ppm)
        precision = (error / self.target_ppm) * 100
        
        if precision <= 0.5:
            print(f"[SUCCESS] Recalibration Verified. Error: {error:.4f} ppm ({precision:.2f}%)")
            self.recalibration_verified = True
            self._transition(MissionState.LANDED)
            return True
        else:
            print(f"[FAILURE] Recalibration Out-of-Bounds: {precision:.2f}%")
            return False

if __name__ == "__main__":
    # Test State Machine Cycle
    dock = DockingManager()
    
    # Simulate return from mission
    dock.update_state(is_armed=False, contact_confirmed=True)
    
    # Simulate calibration with valid data
    # Target 10ppm, error < 0.05
    valid_data = np.full(50, 6.666) # 6.666 * 1.5 = 9.999
    dock.run_sindy_recalibration(valid_data)
    
    print(f"[FINAL] SINDy Integrity: {'HIGH' if dock.recalibration_verified else 'COMPROMISED'}")
