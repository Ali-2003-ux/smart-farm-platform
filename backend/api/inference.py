import torch
import cv2
import numpy as np
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
import os
import pandas as pd
import base64
from core import db, notifications

router = APIRouter()

# --- Configuration ---
# Cloud-Friendly Model Path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_MODEL_PATH = os.path.join(BASE_DIR, "data", "best_model.pth")

MODEL_PATH = os.getenv("MODEL_PATH", DEFAULT_MODEL_PATH)
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
IMG_SIZE = 512

# Global model cache
model_instance = None

def get_model():
    global model_instance
    if model_instance is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
            
        model = smp.Unet(encoder_name="efficientnet-b3", in_channels=4, classes=1, encoder_weights=None)
        
        # Load logic
        try:
            state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
            model.load_state_dict(state_dict)
        except Exception as e:
            # Try to handle the split parts if main file is missing or corrupted?
            # Assuming main file is good as per previous steps.
            print(f"Error loading model: {e}")
            raise e
            
        model.to(DEVICE)
        model.eval()
        model_instance = model
    return model_instance

class SegmentationResponse(BaseModel):
    palm_count: int
    infected_count: int
    avg_health: float
    processed_image_base64: str
    mask_base64: str

@router.post("/predict", response_model=SegmentationResponse)
async def predict_segmentation(file: UploadFile = File(...)):
    model = get_model()
    
    # Read Image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")
        
    # Preprocess
    original_h, original_w = image.shape[:2]
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image_resized = cv2.resize(image_rgb, (IMG_SIZE, IMG_SIZE))
    
    # Alpha channel matching training
    alpha = np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.uint8)
    input_img = cv2.merge((image_resized, alpha))
    
    transform = A.Compose([
        A.Normalize(mean=(0.485, 0.456, 0.406, 0.5), std=(0.229, 0.224, 0.225, 0.5), max_pixel_value=255.0),
        ToTensorV2()
    ])
    
    input_tensor = transform(image=input_img)['image'].unsqueeze(0).to(DEVICE)
    
    # Inference
    with torch.no_grad():
        logits = model(input_tensor)
        pr_mask = logits.sigmoid().squeeze().cpu().numpy()
        
    # Post-process
    mask_resized = (pr_mask > 0.5).astype(np.uint8) * 255
    # Resize back to original? Or keep 512 for display speed? 
    # Let's resize back for precision if needed, but for web 512 is good.
    # We will return 512 for now.
    
    # Counting Logic (High Sensitivity)
    mask_refined = (pr_mask > 0.40).astype(np.uint8) * 255
    kernel = np.ones((3,3), np.uint8)
    mask_refined = cv2.morphologyEx(mask_refined, cv2.MORPH_OPEN, kernel, iterations=1)
    contours, _ = cv2.findContours(mask_refined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Health Analysis
    palm_data = []
    annotated = image_resized.copy()
    
    all_exg = []
    candidates = []
    
    # Pass 1
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 15: continue # Lowered from 50 to 15 to catch small trees
        
        ((x,y), radius) = cv2.minEnclosingCircle(cnt)
        center = (int(x), int(y))
        radius = int(radius)
        
        single_mask = np.zeros_like(mask_refined)
        cv2.circle(single_mask, center, radius, 255, -1)
        mean_val = cv2.mean(image_resized, mask=single_mask)
        R, G, B = mean_val[0], mean_val[1], mean_val[2] # image_resized is RGB
        exg = (2 * G) - R - B
        
        all_exg.append(exg)
        candidates.append({'cnt': cnt, 'c': center, 'r': radius, 'exg': exg})
        
    # Dynamic Threshold
    thresh = 0
    if all_exg:
        thresh = np.mean(all_exg) - (0.5 * np.std(all_exg))
        
    infected_count = 0
    total_health = 0
    
    for c in candidates:
        is_infected = c['exg'] < thresh
        color = (255, 0, 0) if is_infected else (0, 255, 0) # RGB
        if is_infected: infected_count += 1
        
        cv2.circle(annotated, c['c'], c['r'], color, 2)
        total_health += c['exg']
        
    avg_h = (total_health / len(candidates)) if candidates else 0
    
    # --- SAVE TO DB ---
    try:
        palm_records = []
        for c in candidates:
            # Re-calculate area safe or usage
            area_px = cv2.contourArea(c['cnt'])
            palm_records.append({
                'x': c['c'][0],
                'y': c['c'][1],
                'area': area_px,
                'health_score': c['exg']
            })
        survey_id = db.save_scan_results(len(candidates), float(avg_h), palm_records)
        if survey_id:
            print(f"Scan {survey_id} saved successfully.")
            
            # TRIGGER NOTIFICATION ALWAYS (For Verification)
            status_emoji = "✅" if infected_count == 0 else "⚠️"
            status_text = "All Clear" if infected_count == 0 else f"{infected_count} Infected Palms Detected"
            
            msg = (
                f"{status_emoji} Drone Patrol Report (Scan #{survey_id})\n"
                f"Trees: {len(candidates)}\n"
                f"Status: {status_text}"
            )
            notifications.send_telegram_alert(msg)
    except Exception as e:
        print(f"❌ Failed to save scan results: {e}")

    # Encode Images
    _, buffer_img = cv2.imencode('.jpg', cv2.cvtColor(annotated, cv2.COLOR_RGB2BGR))
    img_b64 = base64.b64encode(buffer_img).decode('utf-8')
    
    _, buffer_mask = cv2.imencode('.png', mask_refined)
    mask_b64 = base64.b64encode(buffer_mask).decode('utf-8')
    
    return SegmentationResponse(
        palm_count=len(candidates),
        infected_count=infected_count,
        avg_health=float(avg_h),
        processed_image_base64=img_b64,
        mask_base64=mask_b64
    )
