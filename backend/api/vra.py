
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from core.db import get_latest_palms_df
import json

router = APIRouter()

class VRARequest(BaseModel):
    chemical_name: str
    base_dosage_ml: float # Base dosage for a healthy tree (preventative) or standard treatment
    concentration_factor: float = 1.0

class PalmTreatment(BaseModel):
    palm_id: str
    health_score: float
    dosage_ml: float
    reason: str

@router.post("/calculate")
def calculate_vra(request: VRARequest):
    """
    Calculates Variable Rate Application (VRA) dosages for each palm.
    Formula: Dosage = Base * (1 + (100 - Health) / 100 * Severity_Multiplier)
    """
    try:
        df = get_latest_palms_df()
        if df.empty:
            raise HTTPException(status_code=404, detail="No palm data available.")

        treatments = []
        total_chemical_needed = 0

        for index, row in df.iterrows():
            health = row['health_score']
            
            # VRA Logic
            if health >= 90:
                # Top tier health: Minimal preventative or zero
                dosage = request.base_dosage_ml * 0.1 
                reason = "Preventative (Low)"
            elif health >= 75:
                # Good health: Standard preventative
                dosage = request.base_dosage_ml * 0.5
                reason = "Preventative (Standard)"
            elif health >= 50:
                # Moderate Stress: Full base dosage
                dosage = request.base_dosage_ml
                reason = "Curative (Standard)"
            else:
                # Severe Infection: High dosage (Shock treatment)
                # Severity Multiplier increases as health drops
                severity = (100 - health) / 100
                dosage = request.base_dosage_ml * (1 + severity * 2) # Up to 3x dosage for dying trees
                reason = f"CRITICAL TREATMENT (Severity: {severity:.2f})"

            # Apply concentration factor
            dosage *= request.concentration_factor
            dosage = round(dosage, 1)

            treatments.append(PalmTreatment(
                palm_id=str(row['id']),
                health_score=health,
                dosage_ml=dosage,
                reason=reason
            ))
            total_chemical_needed += dosage

        return {
            "chemical": request.chemical_name,
            "total_palms": len(treatments),
            "total_volume_liters": round(total_chemical_needed / 1000, 2),
            "treatments": treatments
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
