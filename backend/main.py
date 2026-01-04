from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import inference, drone, analytics, export, vra, audit

app = FastAPI(
    title="Smart Farm Enterprise API",
    description="High-performance backend for Agriculture 4.0 Command Center",
    version="2.0.0"
)

# --- CORS Configuration ---
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
app.include_router(inference.router, prefix="/api/v1/inference", tags=["Inference"])
app.include_router(drone.router, prefix="/api/v1/drone", tags=["Drone Operations"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(export.router, prefix="/api/v1/export", tags=["Mission Export"])

app.include_router(vra.router, prefix="/api/v1/vra", tags=["Precision Ag"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Compliance"])

@app.get("/")
def read_root():
    return {"status": "online", "system": "Smart Farm Enterprise Platform"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api"}

@app.get("/debug/notification")
def debug_notification():
    from core import notifications
    success, msg = notifications.send_telegram_alert("🔔 Debug Test Message from Backend Server")
    return {"status": "sent" if success else "failed", "backend_message": msg}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
