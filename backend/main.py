from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import inference, drone, analytics

app = FastAPI(
    title="Smart Farm Enterprise API",
    description="High-performance backend for Agriculture 4.0 Command Center",
    version="2.0.0"
)

# --- CORS Configuration ---
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---
app.include_router(inference.router, prefix="/api/v1/ai", tags=["AI Inference"])
app.include_router(drone.router, prefix="/api/v1/drone", tags=["Drone Operations"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Data Science"])

@app.get("/")
def read_root():
    return {"status": "online", "system": "Smart Farm Enterprise Platform"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
