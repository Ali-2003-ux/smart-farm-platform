from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import math

router = APIRouter()

class TargetPoint(BaseModel):
    x: int
    y: int

class MissionRequest(BaseModel):
    targets: List[TargetPoint]
    anchor_lat: float
    anchor_lon: float
    gsd_cm: float
    altitude: float = 15.0
    speed: float = 5.0

def calculate_gps_coords(pixel_x, pixel_y, anchor_lat, anchor_lon, gsd_cm):
    dist_x_m = (pixel_x * gsd_cm) / 100.0
    dist_y_m = (pixel_y * gsd_cm) / 100.0
    meters_per_deg_lat = 111139.0
    meters_per_deg_lon = 111139.0 * math.cos(math.radians(anchor_lat))
    delta_lat = -(dist_y_m / meters_per_deg_lat) 
    delta_lon = dist_x_m / meters_per_deg_lon
    return anchor_lat + delta_lat, anchor_lon + delta_lon

@router.post("/generate_mission")
def generate_mission(req: MissionRequest):
    if not req.targets:
        raise HTTPException(status_code=400, detail="No targets provided")
        
    file_content = "QGC WPL 110\n"
    seq = 0
    # Home/Start
    file_content += f"{seq}\t1\t0\t16\t0\t0\t0\t0\t{req.anchor_lat:.8f}\t{req.anchor_lon:.8f}\t{req.altitude:.2f}\t1\n"
    seq += 1
    # Speed
    file_content += f"{seq}\t0\t3\t178\t{req.speed:.1f}\t{req.speed:.1f}\t-1\t0\t0\t0\t0\t1\n"
    seq += 1
    
    for t in req.targets:
        lat, lon = calculate_gps_coords(t.x, t.y, req.anchor_lat, req.anchor_lon, req.gsd_cm)
        file_content += f"{seq}\t0\t3\t16\t0.0\t0.0\t0.0\t0.0\t{lat:.8f}\t{lon:.8f}\t{req.altitude:.2f}\t1\n"
        seq += 1
        
    return {"mission_file": file_content}
