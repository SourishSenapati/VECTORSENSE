import json
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VectorSense.Economics")

class FinancialPhysicsBridge:
    """
    Directive 2.1: Navier-Stokes to EBITDA Translation.
    Monetizes the physics of the leak for Plant Managers.
    """
    def __init__(self):
        # Industrial Constants: Mock API for real-time risk assessment
        self.pricing = {
            "Hydrogen": 3.00,  # USD/kg
            "Ethylene": 1.50,  # USD/kg
            "Benzene": 1.15   # USD/kg
        }
        
        # Regulatory Fines (EPA/OSHA Baseline Risk)
        self.epa_penalty_baseline = 25000.00 # Flat fee per reported incident
        self.hourly_risk_rate = 1000.00      # Fines grow with sustained leakage
        
        # LEL: Lower Explosive Limit Thresholds
        self.lel_safety_limit = 0.04 # 4% Concentration volume

    def calculate_threat_economics(self, gas_type, mass_flux, sim_time):
        """
        Input: 
          mass_flux: dm/dt [kg/s] from PINN Navier-Stokes output.
        Output:
          Financial Loss, Risk Multiplier, and LEL countdown.
        """
        price_per_kg = self.pricing.get(gas_type, 1.00)
        
        # 1. Commodity Loss
        loss_per_sec = mass_flux * price_per_kg
        total_commodity_loss = loss_per_sec * sim_time
        
        # 2. Regulatory Exposure
        active_hours = sim_time / 3600.0
        total_epa_risk = self.epa_penalty_baseline + (active_hours * self.hourly_risk_rate)
        
        # 3. LEL Countdown Simulation (Deterministic diffusion model)
        # Time to reach LEL for a confined industrial volume (mock 500m3)
        volume = 500.0 
        attained_mass = mass_flux * sim_time
        current_concentration = attained_mass / (volume * 1.2) # Simplistic density assumption
        
        time_to_lel = max(0, (self.lel_safety_limit - current_concentration) / (mass_flux / (volume * 1.2)))
        
        return {
            "gas_type": gas_type,
            "bleed_rate_usd": round(loss_per_sec * 3600, 2), # USD/hr for UI
            "total_commodity_loss": round(total_commodity_loss, 2),
            "total_regulatory_risk": round(total_epa_risk, 2),
            "time_to_explosive_limit": round(time_to_lel / 60.0, 1), # Minutes
            "mass_loss_rate": round(mass_flux, 4)
        }

if __name__ == "__main__":
    # Integration Test
    bridge = FinancialPhysicsBridge()
    economics = bridge.calculate_threat_economics("Hydrogen", 0.0125, 600)
    logger.info(f"[ECON] Predicted Hourly Bleed: ${economics['bleed_rate_usd']}/hr")
    logger.info(f"[ECON] Risk Timer: {economics['time_to_explosive_limit']} mins to LEL breach.")
