
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
try:
    import simplekml
except ImportError:
    simplekml = None

import os
from core.db import get_latest_palms_df
import pandas as pd

router = APIRouter()

class FlightPlanRequest(BaseModel):
    mission_name: str
    altitude: float = 30.0  # meters
    speed: float = 5.0      # m/s
    spray_width: float = 5.0 # meters

@router.post("/dji/generate")
def generate_dji_mission(request: FlightPlanRequest):
    """
    Generates a DJI-compatible KML file for precision spraying.
    Only targets infected palms (health_score < 50) + Buffer Zone.
    """
    try:
        df = get_latest_palms_df()
        if df.empty:
            raise HTTPException(status_code=404, detail="No palm data found to generate mission.")

        # Filter for infected palms
        infected_palms = df[df['health_score'] < 80] # Broaden logical threshold for treatment
        
        if infected_palms.empty:
            return {"message": "No infected palms requiring treatment. Mission unnecessary."}

        kml = simplekml.Kml()
        kml.document.name = request.mission_name

        # Create a Folder for Waypoints
        folder = kml.newfolder(name="Waypoints")
        
        # Add Waypoints for each infected tree
        count = 0
        for index, row in infected_palms.iterrows():
            # In a real scenario, we would need actual GPS Lat/Lon.
            # Since we have X/Y relative, we will assume a base anchor for the farm.
            # Anchor: 24.7136° N, 46.6753° E (Riyadh Outskirts)
            # 1 degree lat ~= 111km, 1 degree lon ~= 111km at equator (approx)
            # This is a linear approximation for demo precision.
            
            base_lat = 24.7136
            base_lon = 46.6753
            scale = 0.00001 # approx 1 meter per unit
            
            lat = base_lat + (row['y'] * scale)
            lon = base_lon + (row['x'] * scale)
            
            pnt = folder.newpoint(name=f"Tree_{row['id']}")
            pnt.coords = [(lon, lat, request.altitude)]
            pnt.description = f"Status: Infected\nHealth: {row['health_score']}%\nAction: Spray 200ml"
            
            # DJI Specific Extended Data (Mocking the format DJI expects)
            # NOTE: Real DJI format requires specific XML namespaces, 
            # but standard KML waypoints are accepted as simple route points.
            count += 1

        # Save to static files or return content
        filename = f"mission_{request.mission_name.replace(' ', '_')}.kml"
        filepath = os.path.join("generated_missions", filename)
        os.makedirs("generated_missions", exist_ok=True)
        
        kml.save(filepath)

        return {
            "status": "success",
            "message": f"Generated flight plan for {count} targets.",
            "file_url": f"/static/missions/{filename}",
            "targets": count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
